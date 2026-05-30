import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()


def _csv_env(name: str, default: str) -> list[str]:
    raw_value = os.getenv(name, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


class Settings(BaseModel):
    app_name: str = Field(default_factory=lambda: os.getenv("APP_NAME", "ProfitGuard AI"))
    app_version: str = Field(default_factory=lambda: os.getenv("APP_VERSION", "0.1.0"))
    environment: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    api_v1_prefix: str = Field(default_factory=lambda: os.getenv("API_V1_PREFIX", "/api/v1"))
    log_level: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    cors_origins: list[str] = Field(default_factory=lambda: _csv_env("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"))

    neo4j_uri: str = Field(default_factory=lambda: os.getenv("NEO4J_URI", "bolt://localhost:7687"))
    neo4j_username: str = Field(default_factory=lambda: os.getenv("NEO4J_USERNAME", "neo4j"))
    neo4j_password: str = Field(default_factory=lambda: os.getenv("NEO4J_PASSWORD", "profitguard"))
    neo4j_database: str = Field(default_factory=lambda: os.getenv("NEO4J_DATABASE", "neo4j"))
    neo4j_max_connection_pool_size: int = Field(default_factory=lambda: int(os.getenv("NEO4J_MAX_CONNECTION_POOL_SIZE", "50")))
    neo4j_connection_timeout_seconds: float = Field(default_factory=lambda: float(os.getenv("NEO4J_CONNECTION_TIMEOUT_SECONDS", "10")))

    groq_api_key: str | None = Field(default_factory=lambda: os.getenv("GROQ_API_KEY"))
    groq_model: str = Field(default_factory=lambda: os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"))
    groq_temperature: float = Field(default_factory=lambda: float(os.getenv("GROQ_TEMPERATURE", "0.1")))
    groq_max_retries: int = Field(default_factory=lambda: int(os.getenv("GROQ_MAX_RETRIES", "2")))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
