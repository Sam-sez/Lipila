import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.providers import provider
from app import models, schemas

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/cash-out", response_model=schemas.TransactionOut)
def cash_out(body: schemas.AgentCashOut, db: Session = Depends(get_db)):
    """
    User pays an agent, receives cash. Identical mechanics to paying any
    merchant via Static QR — the person whose money is LEAVING (the user)
    authorizes it with their own PIN. Uses Collections.
    """
    user = db.query(models.User).filter_by(id=body.user_id).first()
    agent = db.query(models.User).filter_by(static_qr_token=body.agent_qr_token, is_agent=True).first()
    if not user or not agent:
        raise HTTPException(404, "User or agent not found")

    external_id = str(uuid.uuid4())
    result = provider.request_to_pay(
        payer_number=user.mobile_number, amount=body.amount, currency="ZMW", external_id=external_id,
        note="Cash-out at agent",
    )
    txn = models.Transaction(
        payer_id=user.id, payee_id=agent.id, amount=body.amount, method="static_qr",
        note="Cash-out at agent", auto_tag="Cash-out", provider_reference=result["reference_id"],
        status="pending",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/cash-in", response_model=schemas.TransactionOut)
def cash_in(body: schemas.AgentCashIn, db: Session = Depends(get_db)):
    """
    Agent receives cash from user, pushes equivalent funds into the user's
    wallet. Agent scans the USER's static QR (no manual number typing, no
    typo risk) and enters the amount physically received. The AGENT
    authorizes this on their end (own business credentials) — the user
    does nothing beyond showing their QR and getting a confirmation.
    Uses Disbursements — note this requires the agent to be a verified
    business account for production access (sandbox works today).
    """
    agent = db.query(models.User).filter_by(id=body.agent_id, is_agent=True).first()
    user = db.query(models.User).filter_by(static_qr_token=body.user_qr_token).first()
    if not agent or not user:
        raise HTTPException(404, "Agent or user not found")

    external_id = str(uuid.uuid4())
    result = provider.transfer(
        payee_number=user.mobile_number, amount=body.amount, currency="ZMW", external_id=external_id,
        note="Cash-in via agent",
    )
    txn = models.Transaction(
        payer_id=agent.id, payee_id=user.id, amount=body.amount, method="static_qr",
        note="Cash-in via agent", auto_tag="Cash-in", provider_reference=result["reference_id"],
        status="pending",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/{agent_id}/disclaimer")
def cash_handoff_disclaimer(agent_id: str):
    """
    Stated plainly, not implied: Lipila can only vouch for the digital
    transfer recorded here — never the physical cash handoff itself.
    """
    return {
        "disclaimer": (
            "Lipila records and confirms the digital transfer between you and "
            "this agent. It cannot verify or guarantee the physical cash that "
            "changes hands — that part still depends on trusting the agent in "
            "person, the same as it does today."
        )
    }
