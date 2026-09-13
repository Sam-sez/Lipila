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

# Vercel's Services model forwards the ORIGINAL request path — a request to
# /api/users reaches this app as /api/users, not /users (unlike some other
# platforms that strip the matched prefix). Rather than prefixing every
# router individually, the whole app is built normally on `api_app` and then
# mounted under /api on the outer `app` that Vercel actually serves.
api_app = FastAPI(
    title="Lipila API",
    description=(
        "Orchestration layer over MTN MoMo / Airtel Money. Lipila never "
        "custodies funds or sees a PIN — see /docs for the full flow."
    ),
    version="0.1.0",
)

api_app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_app.include_router(users.router)
api_app.include_router(qr.router)
api_app.include_router(payments.router)
api_app.include_router(favorites.router)
api_app.include_router(bong.router)
api_app.include_router(agents.router)


@api_app.get("/")
def root():
    return {
        "name": "Lipila API",
        "status": "running",
        "payment_provider": settings.PAYMENT_PROVIDER,
        "docs": "/api/docs",
    }


@api_app.get("/health")
def health():
    return {"status": "ok"}


app = FastAPI()
app.mount("/api", api_app)
