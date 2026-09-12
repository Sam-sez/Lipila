from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app import models, schemas, cache

router = APIRouter(prefix="/bong", tags=["bong"])

# Design note: the actual BLE advertise/scan happens on-device (Web Bluetooth
# or native). This router only brokers the server-side half — mapping an
# anonymous session_token to a real user, and revealing identity ONLY once
# a specific candidate is chosen, never broadcasting it to everyone nearby.


@router.post("/announce")
def announce(body: schemas.BongAnnounce):
    """
    Called when a user opens Bong. session_token is what actually gets
    advertised over BLE by the client — it carries no identity by itself.
    Expires automatically after BONG_TOKEN_TTL_SECONDS whether or not a
    match happens, so nothing lingers.
    """
    cache.set_json(
        f"bong:{body.session_token}",
        {"user_id": body.user_id},
        settings.BONG_TOKEN_TTL_SECONDS,
    )
    return {"status": "announced", "expires_in_seconds": settings.BONG_TOKEN_TTL_SECONDS}


@router.post("/candidates")
def candidates(detected: list[schemas.BongScanResult]):
    """
    Client reports which session_tokens it detected over BLE and at what
    signal strength. Server ranks by proximity (higher RSSI = closer) but
    deliberately does NOT reveal identity here — only rank + anonymized
    token, so the payer picks from 'closest' + 'not them? see others'
    before any real name is shown.
    """
    valid = []
    for d in detected:
        record = cache.get_json(f"bong:{d.detected_session_token}")
        if record:
            valid.append((d.detected_session_token, d.rssi))

    if not valid:
        return {"candidates": []}

    valid.sort(key=lambda x: x[1], reverse=True)  # closer (higher RSSI) first
    return {
        "candidates": [
            {"session_token": token, "estimated_distance_rank": i + 1}
            for i, (token, _rssi) in enumerate(valid[:4])  # top match + up to 3 alternates
        ]
    }


@router.post("/reveal/{session_token}", response_model=schemas.DisplayIdentity)
def reveal_identity(session_token: str, db: Session = Depends(get_db)):
    """
    Called only after the payer visually selects a specific candidate —
    this is the one moment identity crosses from anonymous to revealed,
    and only to the device that made this specific request.
    """
    record = cache.get_json(f"bong:{session_token}")
    if not record:
        raise HTTPException(410, "This Bong session has expired")
    user = db.query(models.User).filter_by(id=record["user_id"]).first()
    if not user:
        raise HTTPException(404, "User not found")
    d = user.display_name
    return schemas.DisplayIdentity(
        user_id=user.id, name=d["name"], verified_number_suffix=d["verified_number_suffix"],
        photo_url=user.photo_url,
    )
