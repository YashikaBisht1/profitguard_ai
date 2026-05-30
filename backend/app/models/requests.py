from pydantic import BaseModel, Field


class FraudCheckRequest(BaseModel):
    customer_id: str = Field(..., examples=["CUST-001"])
    order_id: str | None = Field(default=None, examples=["ORD-0001"])
    payment_fingerprint: str | None = Field(default=None, examples=["PAY-FP-FRAUD-RING-A"])
    address_hash: str | None = Field(default=None, examples=["ADDR-HASH-FRAUD-RING-A"])
    include_graph_context: bool = True


class ReturnAnalysisRequest(BaseModel):
    customer_id: str = Field(..., examples=["CUST-008"])
    order_id: str = Field(..., examples=["ORD-0083"])
    return_request_id: str | None = Field(default=None, examples=["RET-001"])
    reason_code: str | None = Field(default=None, examples=["ITEM_NOT_AS_DESCRIBED"])
    reason_text: str | None = Field(default=None, examples=["Customer says item was not as described."])
    refund_amount: float | None = Field(default=None, ge=0)
    include_graph_context: bool = True
