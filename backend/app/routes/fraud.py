from fastapi import APIRouter, Depends, HTTPException, status
from neo4j.exceptions import Neo4jError, ServiceUnavailable

from app.models.requests import FraudCheckRequest, ReturnAnalysisRequest
from app.models.responses import FraudCheckResponse, ReturnAnalysisResponse
from app.services.fraud_service import FraudService
from app.services.return_service import ReturnAnalysisService

router = APIRouter()


def get_fraud_service() -> FraudService:
    return FraudService()


def get_return_service() -> ReturnAnalysisService:
    return ReturnAnalysisService()


@router.post("/fraud-check", response_model=FraudCheckResponse)
async def fraud_check(
    request: FraudCheckRequest,
    service: FraudService = Depends(get_fraud_service),
) -> FraudCheckResponse:
    try:
        return await service.check_fraud(request)
    except ServiceUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable for fraud checks.",
        ) from exc
    except Neo4jError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Graph query failed: {exc.code or exc.__class__.__name__}",
        ) from exc


@router.post("/analyze-return", response_model=ReturnAnalysisResponse)
async def analyze_return(
    request: ReturnAnalysisRequest,
    service: ReturnAnalysisService = Depends(get_return_service),
) -> ReturnAnalysisResponse:
    try:
        return await service.analyze_return(request)
    except ServiceUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable for return analysis.",
        ) from exc
    except Neo4jError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Graph query failed: {exc.code or exc.__class__.__name__}",
        ) from exc
