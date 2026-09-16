"""
PERITIA - System Health and Status API Routes
"""
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


class HealthStatus(BaseModel):
    status: str
    watsonx_configured: bool
    rag_ready: bool
    model_id: str
    version: str


@router.get("/health", response_model=HealthStatus)
async def health_check():
    """System health and configuration status."""
    settings = get_settings()

    # Check RAG status (non-blocking)
    rag_ready = False
    try:
        from app.services.rag_service import get_rag_service
        rag = get_rag_service()
        rag_ready = rag.is_ready()
    except Exception:
        pass

    return HealthStatus(
        status="ok",
        watsonx_configured=settings.is_watsonx_configured,
        rag_ready=rag_ready,
        model_id=settings.IBM_MODEL_ID,
        version=settings.APP_VERSION,
    )
