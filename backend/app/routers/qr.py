import uuid
import io
import base64
import qrcode
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app import models, schemas, cache

router = APIRouter(prefix="/qr", tags=["qr"])


def _qr_image_base64(payload: str) -> str:
    img = qrcode.make(payload)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _display_identity(user: models.User) -> schemas.DisplayIdentity:
    d = user.display_name
    return schemas.DisplayIdentity(
        user_id=user.id, name=d["name"], verified_number_suffix=d["verified_number_suffix"],
        photo_url=user.photo_url,
    )


@router.get("/static/{user_id}")
def get_static_qr(user_id: str, db: Session = Depends(get_db)):
    """
    Fixed QR tied to a merchant/user's account. Never expires. Identifies
    WHO to pay, not how much — payer enters the amount after seeing the
    verified identity, per the anti-fraud requirement in the blueprint.
    """
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    payload = f"lipila://static/{user.static_qr_token}"
    return {
        "qr_token": user.static_qr_token,
        "qr_payload": payload,
        "qr_image": _qr_image_base64(payload),
    }


@router.post("/static/resolve", response_model=schemas.DisplayIdentity)
def resolve_static_qr(body: schemas.StaticQRResolve, db: Session = Depends(get_db)):
    """Called after a scan — resolves the token to a verified identity
    BEFORE any amount is entered or payment confirmed."""
    user = db.query(models.User).filter_by(static_qr_token=body.qr_token).first()
    if not user:
        raise HTTPException(404, "Invalid or tampered QR code")
    return _display_identity(user)


@router.post("/dynamic", response_model=schemas.DynamicQROut)
def create_dynamic_qr(body: schemas.DynamicQRCreate, db: Session = Depends(get_db)):
    """
    Generated on the fly with the exact amount pre-filled. Expires via
    Redis TTL (or in-memory fallback) so a stale QR can't be reused later
    at a different amount.
    """
    payee = db.query(models.User).filter_by(id=body.payee_id).first()
    if not payee:
        raise HTTPException(404, "Payee not found")

    qr_token = str(uuid.uuid4())
    cache.set_json(
        f"dynqr:{qr_token}",
        {"payee_id": payee.id, "amount": body.amount, "note": body.note},
        settings.DYNAMIC_QR_TTL_SECONDS,
    )
    return schemas.DynamicQROut(
        qr_token=qr_token,
        payee=_display_identity(payee),
        amount=body.amount,
        expires_in_seconds=settings.DYNAMIC_QR_TTL_SECONDS,
    )


@router.get("/dynamic/{qr_token}/image")
def get_dynamic_qr_image(qr_token: str):
    data = cache.get_json(f"dynqr:{qr_token}")
    if not data:
        raise HTTPException(410, "This QR code has expired")
    payload = f"lipila://dynamic/{qr_token}"
    return {"qr_payload": payload, "qr_image": _qr_image_base64(payload)}


@router.post("/dynamic/resolve")
def resolve_dynamic_qr(body: schemas.StaticQRResolve, db: Session = Depends(get_db)):
    """Resolves a dynamic QR scan to a locked-in amount + verified payee.
    Returns 410 if expired so the frontend can prompt a fresh scan."""
    data = cache.get_json(f"dynqr:{body.qr_token}")
    if not data:
        raise HTTPException(410, "This QR code has expired — ask for a new one")
    payee = db.query(models.User).filter_by(id=data["payee_id"]).first()
    if not payee:
        raise HTTPException(404, "Payee no longer exists")
    return {
        "payee": _display_identity(payee),
        "amount": data["amount"],
        "note": data.get("note"),
    }
