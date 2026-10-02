"""
Main FastAPI application for DocuChat backend.
"""

import time
import signal
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum
import os

from .api.routes import router
from .config import settings
from .logging_system import log_error, logger

# Graceful shutdown handling
shutdown_event = None

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    global shutdown_event
    if shutdown_event:
        shutdown_event.set()

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    # Startup
    logger.info("Starting DocuChat API...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    yield
    # Shutdown
    logger.info("Shutting down DocuChat API...")


# Create FastAPI app
app = FastAPI(
    title="DocuChat API",
    description="AI-powered Question Answering System for Academic Documents",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS with environment variable
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all API requests and responses."""
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )
        
        # Add performance header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
        
    except Exception as e:
        # Log error
        process_time = time.time() - start_time
        log_error(
            error_type="request_error",
            error_message=str(e),
            context={
                "method": request.method,
                "path": request.url.path,
                "process_time": process_time
            }
        )
        raise


# Standardized error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with standardized error response."""
    log_error(
        error_type="unhandled_exception",
        error_message=str(exc),
        context={
            "method": request.method,
            "path": request.url.path,
            "error_type": type(exc).__name__
        }
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "details": str(exc) if os.getenv("ENVIRONMENT") == "development" else None
        }
    )


# Include API routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "status": "healthy",
        "service": "DocuChat API",
        "version": "1.0.0",
        "documentation": "/docs",
        "endpoints": {
            "upload": "/api/upload",
            "ask": "/api/ask",
            "documents": "/api/documents"
        }
    }


@app.get("/health")
async def health():
    """
    Detailed health check endpoint.
    Checks if all dependencies are available.
    """
    health_status = {
        "status": "healthy",
        "service": "DocuChat API",
        "version": "1.0.0",
        "timestamp": time.time(),
        "checks": {}
    }
    
    # Check Supabase connection
    try:
        from .storage import supabase
        # Simple query to test connection
        supabase.table("documents").select("id").limit(1).execute()
        health_status["checks"]["supabase"] = "healthy"
    except Exception as e:
        health_status["checks"]["supabase"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check embedding model
    try:
        from .nlp.embed import get_model
        model = get_model()
        health_status["checks"]["embedding_model"] = "healthy"
    except Exception as e:
        health_status["checks"]["embedding_model"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check LLM providers
    llm_providers = []
    if settings.GROQ_API_KEY:
        llm_providers.append("groq")
    if settings.CEREBRAS_API_KEY:
        llm_providers.append("cerebras")
    if settings.LOCAL_LLM_URL:
        llm_providers.append("local")
    
    health_status["checks"]["llm_providers"] = {
        "available": llm_providers,
        "count": len(llm_providers)
    }
    
    if len(llm_providers) == 0:
        health_status["status"] = "degraded"
        health_status["checks"]["llm_providers"] = "no providers configured"
    
    return health_status


@app.get("/metrics")
async def metrics():
    """
    Basic metrics endpoint.
    Returns summary statistics from logs.
    """
    from .logging_system import get_log_summary
    
    summary = get_log_summary()
    
    return {
        "metrics": summary,
        "timestamp": time.time()
    }


# Vercel serverless handler
handler = Mangum(app)
