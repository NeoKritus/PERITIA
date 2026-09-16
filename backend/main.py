"""
PERITIA - FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api import interview, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    import asyncio
    settings = get_settings()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"watsonx configured: {settings.is_watsonx_configured}")

    # Pre-build RAG index in background thread to avoid blocking startup
    async def _build_rag():
        try:
            from app.services.rag_service import get_rag_service
            rag = get_rag_service()
            if rag.is_ready():
                logger.info("RAG index ready")
            else:
                logger.warning("RAG index not ready — retrieval will be limited")
        except Exception as e:
            logger.error(f"RAG initialization error: {e}")

    asyncio.create_task(_build_rag())

    yield
    logger.info("PERITIA shutting down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        description="AI-Powered RAG-Based Intelligent Interview Trainer",
        version=settings.APP_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        lifespan=lifespan,
    )

    # CORS for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health.router, prefix="/api", tags=["System"])
    app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
