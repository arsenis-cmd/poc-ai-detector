from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import init_db
from app.routes import detect_router, stats_router, attention_router
from app.routes.factcheck import router as factcheck_router
from app.routes.companion import router as companion_router
from app.routes.impressions import router as impressions_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting PoC MVP API...")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="PoC MVP API",
    description="Proof of Consideration - AI Content Detection",
    version="0.1.0",
    lifespan=lifespan
)

# CORS - allow extension and dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(detect_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")
app.include_router(attention_router, prefix="/api/v1")
app.include_router(factcheck_router)
app.include_router(companion_router)
app.include_router(impressions_router)

@app.get("/")
async def root():
    return {
        "name": "PoC MVP API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
