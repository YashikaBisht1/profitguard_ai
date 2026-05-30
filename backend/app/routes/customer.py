from fastapi import APIRouter, Depends, HTTPException, status

from app.graph.repositories import FraudGraphRepository
from app.models.responses import CustomerGraphResponse

router = APIRouter()


def get_graph_repository() -> FraudGraphRepository:
    return FraudGraphRepository()


@router.get("/customer/{customer_id}/graph", response_model=CustomerGraphResponse)
async def customer_graph(
    customer_id: str,
    repository: FraudGraphRepository = Depends(get_graph_repository),
) -> CustomerGraphResponse:
    graph = await repository.fetch_customer_graph(customer_id)
    if graph.get("graph_available") is False:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable for customer graph.",
        )
    if not graph["nodes"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} was not found.",
        )
    return CustomerGraphResponse(**graph)
