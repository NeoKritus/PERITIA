"""
PERITIA - Application Configuration
Loads settings from environment variables. Never hardcode credentials.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # IBM watsonx.ai configuration
    IBM_API_KEY: str = ""
    IBM_PROJECT_ID: str = ""
    IBM_MODEL_ID: str = "meta-llama/llama-3-3-70b-instruct"
    IBM_URL: str = "https://eu-gb.ml.cloud.ibm.com"
    IBM_API_VERSION: str = "2023-05-29"

    # Application settings
    APP_NAME: str = "PERITIA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Storage
    DB_PATH: str = "peritia_db.json"

    # RAG settings
    KNOWLEDGE_BASE_PATH: str = "data/knowledge_base"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    TOP_K_RETRIEVAL: int = 5
    CHUNK_SIZE: int = 512

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_watsonx_configured(self) -> bool:
        return bool(self.IBM_API_KEY and self.IBM_PROJECT_ID)

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
