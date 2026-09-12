import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.providers import provider
from app import models, schemas

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/confirm", response_model=schemas.TransactionOut)
def confirm_payment(body: schemas.PaymentConfirm, db: Session = Depends(get_db)):
    """
    The single funnel every discovery method (Static QR, Dynamic QR, Bong,
    Favorites) leads to. By the time this is called, the frontend has
    already: shown the verified recipient identity, gotten biometric
    confirmation locally. This endpoint fires Collections (request_to_pay)
    — the provider then pushes ITS OWN native PIN prompt to the payer's
    phone. Lipila never sees or stores that PIN, only the resulting status.
    """
    payer = db.query(models.User).filter_by(id=body.payer_id).first()
    payee = db.query(models.User).filter_by(id=body.payee_id).first()
    if not payer or not payee:
        raise HTTPException(404, "Payer or payee not found")

    external_id = str(uuid.uuid4())
    result = provider.request_to_pay(
        payer_number=payer.mobile_number,
        amount=body.amount,
        currency="ZMW",
        external_id=external_id,
        note=body.note,
    )

    txn = models.Transaction(
        payer_id=payer.id,
        payee_id=payee.id,
        amount=body.amount,
        method=body.method,
        note=body.note,
        provider_reference=result["reference_id"],
        status="pending",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    if body.save_as_favorite:
        exists = (
            db.query(models.Favorite)
            .filter_by(owner_id=payer.id, saved_user_id=payee.id)
            .first()
        )
        if not exists:
            db.add(models.Favorite(owner_id=payer.id, saved_user_id=payee.id))
            db.commit()

    return txn


@router.get("/{transaction_id}/status", response_model=schemas.TransactionOut)
def check_status(transaction_id: str, db: Session = Depends(get_db)):
    """
    Poll this after /confirm — in production this logic also runs from a
    provider webhook, this endpoint just lets the frontend pull the same
    result on demand (useful for demo mode with no real webhook receiver).
    """
    txn = db.query(models.Transaction).filter_by(id=transaction_id).first()
    if not txn:
        raise HTTPException(404, "Transaction not found")
    if txn.status == "pending" and txn.provider_reference:
        result = provider.get_payment_status(txn.provider_reference)
        txn.status = result["status"].lower() if result["status"] != "PENDING" else "pending"
        if txn.status == "successful":
            txn.status = "successful"
        elif result["status"] == "FAILED":
            txn.status = "failed"
        db.commit()
        db.refresh(txn)
    return txn


@router.get("/history/{user_id}", response_model=list[schemas.TransactionOut])
def transaction_history(user_id: str, db: Session = Depends(get_db)):
    """Doubles as the lightweight personal/business ledger — notes included."""
    return (
        db.query(models.Transaction)
        .filter(
            (models.Transaction.payer_id == user_id) | (models.Transaction.payee_id == user_id)
        )
        .order_by(models.Transaction.created_at.desc())
        .all()
    )
