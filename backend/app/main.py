from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.config import settings
from app.routers import users, qr, payments, favorites, bong, agents
import os
import logging

logger = logging.getLogger("lipila")

# Vercel sets VERCEL=1 in its build/runtime environment automatically.
# If we're there without a real Postgres URL, every request will silently
# write to a SQLite file that vanishes the moment this invocation ends —
# far more confusing to debug than a loud warning at boot.
if os.getenv("VERCEL") and settings.DATABASE_URL.startswith("sqlite"):
    logger.warning(
        "Running on Vercel with a SQLite DATABASE_URL. Data will NOT persist "
        "between requests. Set DATABASE_URL to a Neon Postgres connection "
        "string in your Vercel project's environment variables."
    )
if os.getenv("VERCEL") and settings.REDIS_URL.startswith("redis://localhost"):
    logger.warning(
        "Running on Vercel with a local REDIS_URL. Dynamic QR and Bong "
        "tokens will appear to expire immediately. Add Upstash Redis from "
        "the Vercel Marketplace and set REDIS_URL to its connection string."
    )

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lipila API",
    description=(
        "Orchestration layer over MTN MoMo / Airtel Money. Lipila never "
        "custodies funds or sees a PIN — see /docs for the full flow."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(qr.router)
app.include_router(payments.router)
app.include_router(favorites.router)
app.include_router(bong.router)
app.include_router(agents.router)


@app.get("/")
def root():
    return {
        "name": "Lipila API",
        "status": "running",
        "payment_provider": settings.PAYMENT_PROVIDER,
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
