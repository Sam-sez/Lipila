"""
Central config. Everything that changes between dev/mock and production
(real Neon DB, real MTN keys, real Redis) lives here as env vars with
safe local defaults. Nothing below needs code changes to go live later.
"""
import os


class Settings:
    # --- Database ---
    # Local dev: SQLite file, zero setup.
    # Production: set DATABASE_URL to your Neon Postgres connection string,
    # e.g. postgresql://user:pass@ep-xxxx.neon.tech/lipila?sslmode=require
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lipila.db")

    # --- Redis (Dynamic QR + Bong proximity token TTLs) ---
    # Local dev: falls back to an in-memory fake if no Redis is running.
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # --- Payment provider ---
    # "mock"  -> fully simulated, no real account needed (default, works today)
    # "mtn"   -> real MTN MoMo Collections/Disbursements API (needs keys below)
    PAYMENT_PROVIDER: str = os.getenv("PAYMENT_PROVIDER", "mock")

    MTN_SUBSCRIPTION_KEY: str = os.getenv("MTN_SUBSCRIPTION_KEY", "")
    MTN_API_USER: str = os.getenv("MTN_API_USER", "")
    MTN_API_KEY: str = os.getenv("MTN_API_KEY", "")
    MTN_TARGET_ENVIRONMENT: str = os.getenv("MTN_TARGET_ENVIRONMENT", "sandbox")
    MTN_BASE_URL: str = os.getenv("MTN_BASE_URL", "https://sandbox.momodeveloper.mtn.com")

    # --- QR / Bong expiry windows ---
    DYNAMIC_QR_TTL_SECONDS: int = int(os.getenv("DYNAMIC_QR_TTL_SECONDS", "180"))
    BONG_TOKEN_TTL_SECONDS: int = int(os.getenv("BONG_TOKEN_TTL_SECONDS", "60"))

    # --- CORS (frontend origin) ---
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
