from typing import Any

from neo4j.exceptions import Neo4jError, ServiceUnavailable

from app.graph.neo4j import neo4j_manager
from app.models.requests import FraudCheckRequest, ReturnAnalysisRequest


class FraudGraphRepository:
    async def fetch_customer_graph(self, customer_id: str) -> dict[str, Any]:
        query = """
        MATCH (root:Customer {customerId: $customer_id})
        OPTIONAL MATCH directPath = (root)-[:USES_ADDRESS|USES_PAYMENT|SHARES_ADDRESS_WITH|SHARES_PAYMENT_WITH]-(direct)
        WITH root, collect(DISTINCT directPath) AS directPaths
        OPTIONAL MATCH neighborPath = (root)-[:SHARES_ADDRESS_WITH|SHARES_PAYMENT_WITH]-(linked:Customer)-[:USES_ADDRESS|USES_PAYMENT]->(resource)
        WITH root, directPaths, collect(DISTINCT neighborPath) AS neighborPaths
        WITH root, [path IN directPaths + neighborPaths WHERE path IS NOT NULL] AS paths
        WITH root, paths,
             reduce(allNodes = [root], path IN paths | allNodes + nodes(path)) AS pathNodes,
             reduce(allRelationships = [], path IN paths | allRelationships + relationships(path)) AS pathRelationships
        UNWIND pathNodes AS node
        WITH root, collect(DISTINCT node) AS nodes, pathRelationships
        RETURN root, nodes, pathRelationships AS relationships
        """
        try:
            async with neo4j_manager.session() as session:
                result = await session.run(query, customer_id=customer_id)
                record = await result.single()
                if not record:
                    return {"customer_id": customer_id, "nodes": [], "links": []}
                return self._format_customer_graph(customer_id, record["nodes"], record["relationships"])
        except (ServiceUnavailable, Neo4jError) as exc:
            return {"customer_id": customer_id, "nodes": [], "links": [], "graph_available": False, "graph_error": exc.__class__.__name__}

    async def fetch_fraud_context(self, request: FraudCheckRequest) -> dict[str, Any]:
        query = """
        MATCH (c:Customer {customerId: $customer_id})
        OPTIONAL MATCH (c)-[:PLACED]->(o:Order)
        OPTIONAL MATCH (c)-[sp:SHARES_PAYMENT_WITH]-(:Customer)
        OPTIONAL MATCH (c)-[sa:SHARES_ADDRESS_WITH]-(:Customer)
        OPTIONAL MATCH (c)-[:PLACED]->(:Order)-[:USED]->(coupon:Coupon)
        OPTIONAL MATCH (pm:PaymentMethod {paymentFingerprint: $payment_fingerprint})
        OPTIONAL MATCH (addr:Address {addressHash: $address_hash})
        RETURN
          c.customerId AS customer_id,
          c.riskScore AS customer_risk_score,
          c.accountStatus AS account_status,
          count(DISTINCT sp) AS shared_payment_count,
          count(DISTINCT sa) AS shared_address_count,
          count(DISTINCT CASE WHEN o.fraudStatus <> 'CLEAR' THEN o END) AS high_risk_order_count,
          count(DISTINCT CASE WHEN coupon.campaignId STARTS WITH 'CMP-ABUSE' OR coupon.campaignId IN ['CMP-RETURN-LOOP', 'CMP-GIFTCARD-RISK', 'CMP-FLASH-RISK'] THEN o END) AS coupon_abuse_order_count,
          pm IS NOT NULL AS payment_fingerprint_match,
          addr IS NOT NULL AS address_hash_match,
          collect(DISTINCT coupon.code)[0..10] AS coupon_codes
        """
        try:
            async with neo4j_manager.session() as session:
                result = await session.run(
                    query,
                    customer_id=request.customer_id,
                    order_id=request.order_id,
                    payment_fingerprint=request.payment_fingerprint,
                    address_hash=request.address_hash,
                )
                record = await result.single()
                return dict(record) if record else self._empty_fraud_context(request)
        except (ServiceUnavailable, Neo4jError) as exc:
            return self._unavailable_fraud_context(request, exc)

    async def fetch_return_context(self, request: ReturnAnalysisRequest) -> dict[str, Any]:
        query = """
        MATCH (c:Customer {customerId: $customer_id})
        OPTIONAL MATCH (c)-[:PLACED]->(o:Order)-[:RETURNED]->(rr:ReturnRequest)
        OPTIONAL MATCH (c)-[sp:SHARES_PAYMENT_WITH]-(:Customer)
        OPTIONAL MATCH (c)-[sa:SHARES_ADDRESS_WITH]-(:Customer)
        OPTIONAL MATCH (targetOrder:Order {orderId: $order_id})-[:CONTAINS]->(p:Product)-[:BELONGS_TO]->(cat:Category)
        RETURN
          c.customerId AS customer_id,
          c.riskScore AS customer_risk_score,
          c.accountStatus AS account_status,
          count(DISTINCT rr) AS return_count,
          count(DISTINCT CASE WHEN rr.returnStatus = 'MANUAL_REVIEW' THEN rr END) AS manual_review_return_count,
          count(DISTINCT CASE WHEN rr.returnStatus = 'REJECTED' THEN rr END) AS rejected_return_count,
          count(DISTINCT CASE WHEN rr.refundAmount >= 300 THEN rr END) AS high_value_return_count,
          count(DISTINCT sp) AS shared_payment_count,
          count(DISTINCT sa) AS shared_address_count,
          collect(DISTINCT cat.name)[0..8] AS product_categories,
          collect(DISTINCT p.name)[0..8] AS product_names
        """
        try:
            async with neo4j_manager.session() as session:
                result = await session.run(
                    query,
                    customer_id=request.customer_id,
                    order_id=request.order_id,
                    return_request_id=request.return_request_id,
                    reason_text=request.reason_text,
                )
                record = await result.single()
                return dict(record) if record else self._empty_return_context(request)
        except (ServiceUnavailable, Neo4jError) as exc:
            return self._unavailable_return_context(request, exc)

    def _empty_fraud_context(self, request: FraudCheckRequest) -> dict[str, Any]:
        return {
            "customer_id": request.customer_id,
            "customer_risk_score": 0.0,
            "account_status": "UNKNOWN",
            "shared_payment_count": 0,
            "shared_address_count": 0,
            "high_risk_order_count": 0,
            "coupon_abuse_order_count": 0,
            "payment_fingerprint_match": False,
            "address_hash_match": False,
            "coupon_codes": [],
            "graph_available": True,
        }

    def _empty_return_context(self, request: ReturnAnalysisRequest) -> dict[str, Any]:
        return {
            "customer_id": request.customer_id,
            "customer_risk_score": 0.0,
            "account_status": "UNKNOWN",
            "return_count": 0,
            "manual_review_return_count": 0,
            "rejected_return_count": 0,
            "high_value_return_count": 0,
            "shared_payment_count": 0,
            "shared_address_count": 0,
            "product_categories": [],
            "product_names": [],
            "graph_available": True,
        }

    def _unavailable_fraud_context(self, request: FraudCheckRequest, exc: Exception) -> dict[str, Any]:
        context = self._empty_fraud_context(request)
        context["graph_available"] = False
        context["graph_error"] = exc.__class__.__name__
        return context

    def _unavailable_return_context(self, request: ReturnAnalysisRequest, exc: Exception) -> dict[str, Any]:
        context = self._empty_return_context(request)
        context["graph_available"] = False
        context["graph_error"] = exc.__class__.__name__
        return context

    def _format_customer_graph(self, customer_id: str, nodes: list[Any], relationships: list[Any]) -> dict[str, Any]:
        graph_nodes: dict[str, dict[str, Any]] = {}

        for node in nodes:
            labels = set(node.labels)
            properties = self._json_properties(dict(node))
            node_id = self._node_id(labels, properties)
            if not node_id:
                continue
            graph_nodes[node_id] = {
                "id": node_id,
                "label": self._node_label(labels, properties, node_id),
                "type": self._node_type(labels),
                "riskScore": properties.get("riskScore"),
                "val": self._node_size(labels, properties, node_id == customer_id),
                "properties": properties,
            }

        graph_links: list[dict[str, Any]] = []
        seen_links: set[tuple[str, str, str]] = set()
        for rel in relationships:
            source = graph_nodes.get(self._node_id(set(rel.start_node.labels), dict(rel.start_node)))
            target = graph_nodes.get(self._node_id(set(rel.end_node.labels), dict(rel.end_node)))
            if not source or not target:
                continue
            rel_type = rel.type
            key = (source["id"], target["id"], rel_type)
            if key in seen_links:
                continue
            seen_links.add(key)
            graph_links.append(
                {
                    "source": source["id"],
                    "target": target["id"],
                    "type": rel_type,
                    "label": rel_type.replace("_", " ").title(),
                    "score": dict(rel).get("score"),
                    "properties": self._json_properties(dict(rel)),
                }
            )

        return {"customer_id": customer_id, "nodes": list(graph_nodes.values()), "links": graph_links}

    def _node_id(self, labels: set[str], properties: dict[str, Any]) -> str | None:
        if "Customer" in labels:
            return properties.get("customerId")
        if "Address" in labels:
            return properties.get("addressHash") or properties.get("addressId")
        if "PaymentMethod" in labels:
            return properties.get("paymentFingerprint") or properties.get("paymentMethodId")
        return None

    def _node_type(self, labels: set[str]) -> str:
        if "Customer" in labels:
            return "customer"
        if "Address" in labels:
            return "address"
        if "PaymentMethod" in labels:
            return "payment"
        return "customer"

    def _node_label(self, labels: set[str], properties: dict[str, Any], node_id: str) -> str:
        if "Customer" in labels:
            return f"{properties.get('fullName', 'Customer')} ({node_id})"
        if "Address" in labels:
            return f"{properties.get('city', 'Address')}, {properties.get('region', '')} ({node_id})"
        if "PaymentMethod" in labels:
            brand = properties.get("cardBrand") or properties.get("paymentType") or "Payment"
            last4 = properties.get("last4")
            return f"{brand} {last4 or ''} ({node_id})"
        return node_id

    def _node_size(self, labels: set[str], properties: dict[str, Any], is_root: bool) -> int:
        if is_root:
            return 32
        if "Customer" in labels:
            return 24 if float(properties.get("riskScore") or 0) >= 0.7 else 18
        return 16

    def _json_properties(self, properties: dict[str, Any]) -> dict[str, Any]:
        return {key: self._json_value(value) for key, value in properties.items()}

    def _json_value(self, value: Any) -> Any:
        if hasattr(value, "iso_format"):
            return value.iso_format()
        if hasattr(value, "isoformat"):
            return value.isoformat()
        if isinstance(value, list):
            return [self._json_value(item) for item in value]
        if isinstance(value, dict):
            return {key: self._json_value(item) for key, item in value.items()}
        return value
