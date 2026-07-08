"""FastAPI application factory for RailMind AI."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core.exceptions import RailMindError
from app.middleware.request_id import RequestIDMiddleware
from app.utils.logger import get_logger, setup_logging
from app.services.simulation import simulation_engine
import asyncio

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: setup and teardown."""
    setup_logging(log_level=settings.log_level, log_format=settings.log_format)
    logger.info(
        "application_startup",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
    )
    
    # Start simulation engine
    sim_task = asyncio.create_task(simulation_engine.start())
    
    yield
    
    # Stop simulation engine
    simulation_engine.stop()
    await sim_task
    
    logger.info("application_shutdown")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="RailMind AI API",
        description=(
            "AI-Assisted Railway Operations Intelligence Platform API. "
            "This platform is an independent educational and operational simulation "
            "and is not affiliated with, endorsed by, or a replacement for Indian Railways "
            "Kavach or any certified railway safety system."
        ),
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # Middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RequestIDMiddleware)

    # Exception handlers
    @application.exception_handler(RailMindError)
    async def railmind_error_handler(
        request: Request, exc: RailMindError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "error": exc.message,
                "detail": exc.detail,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(
            "unhandled_exception",
            error=str(exc),
            error_type=type(exc).__name__,
            path=str(request.url),
            method=request.method,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": "An unexpected error occurred.",
                "request_id": getattr(request.state, "request_id", None),
            },
        )

    # Health check
    @application.get("/api/health", tags=["System"])
    def health_check() -> dict[str, str]:
        """Return application health status."""
        return {
            "status": "healthy",
            "version": settings.app_version,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # Register API routers
    from app.api.routes import router as api_router

    application.include_router(api_router, prefix="/api")

    return application


app = create_app()
