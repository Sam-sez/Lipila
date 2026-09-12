from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.config import settings
from app.routers import users, qr, payments, favorites, bong, agents

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
