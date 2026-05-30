from fastapi import APIRouter

from app.graph.neo4j import neo4j_manager
from app.models.responses import HealthResponse
from app.utils.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    graph_status = await neo4j_manager.health_check()
    status = "ok" if graph_status["connected"] else "degraded"
    return HealthResponse(
        status=status,
        service=settings.app_name,
        version=settings.app_version,
        graph=graph_status,
    )
