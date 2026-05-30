import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncSession

from app.utils.config import settings

logger = logging.getLogger(__name__)


class Neo4jConnectionManager:
    def __init__(self) -> None:
        self._driver: AsyncDriver | None = None

    async def connect(self) -> None:
        if self._driver is not None:
            return

        self._driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password),
            max_connection_pool_size=settings.neo4j_max_connection_pool_size,
            connection_timeout=settings.neo4j_connection_timeout_seconds,
        )
        logger.info("Neo4j driver initialized for %s", settings.neo4j_uri)

    async def close(self) -> None:
        if self._driver is not None:
            await self._driver.close()
            self._driver = None
            logger.info("Neo4j driver closed")

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        if self._driver is None:
            await self.connect()
        if self._driver is None:
            raise RuntimeError("Neo4j driver was not initialized.")

        async with self._driver.session(database=settings.neo4j_database) as session:
            yield session

    async def health_check(self) -> dict[str, Any]:
        try:
            if self._driver is None:
                await self.connect()
            if self._driver is None:
                return {"connected": False, "database": settings.neo4j_database}
            await self._driver.verify_connectivity()
            return {"connected": True, "database": settings.neo4j_database}
        except Exception as exc:
            logger.warning("Neo4j health check failed: %s", exc)
            return {"connected": False, "database": settings.neo4j_database, "error": exc.__class__.__name__}


neo4j_manager = Neo4jConnectionManager()
