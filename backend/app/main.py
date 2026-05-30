from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.graph.neo4j import neo4j_manager
from app.routes.customer import router as customer_router
from app.routes.fraud import router as fraud_router
from app.routes.health import router as health_router
from app.routes.analyze import router as analyze_router
from app.utils.config import settings
from app.utils.logging import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.log_level)
    await neo4j_manager.connect()
    try:
        yield
    finally:
        await neo4j_manager.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="GraphRAG ecommerce fraud detection APIs for returns, coupon abuse, and linked-entity risk.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    


    app.include_router(health_router, tags=["health"])
    app.include_router(customer_router, prefix="/api", tags=["customer"])
    app.include_router(fraud_router, prefix=settings.api_v1_prefix, tags=["fraud"])
    app.include_router(
    analyze_router,
    prefix=settings.api_v1_prefix,
    tags=["analysis"]
)
    
    return app


app = create_app()
