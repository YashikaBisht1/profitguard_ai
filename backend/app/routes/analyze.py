from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ReturnRequest(BaseModel):
    customer_id: str
    product_id: str
    reason: str
    order_id: str


@router.post("/analyze-return")
async def analyze_return(data: ReturnRequest):
    return {
        "decision": "Exchange",
        "risk_score": 0.12,
        "confidence": 0.91,
        "reasoning": "Customer has only one return in 18 months"
    }