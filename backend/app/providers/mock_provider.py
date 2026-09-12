import uuid
import random
from typing import Optional
from app.providers.base import PaymentProvider

# In-memory store standing in for "what the provider's servers know" during
# local/demo mode. Cleared on restart — fine for demo purposes, since real
# money never touches this path anyway.
_MOCK_LEDGER: dict[str, dict] = {}


class MockProvider(PaymentProvider):
    """
    Fully simulated Collections + Disbursements. Response shape mirrors
    MTN MoMo's real API closely enough that swapping in MTNProvider later
    requires no changes to any router or schema — only PAYMENT_PROVIDER=mtn.

    Behaviour: resolves to SUCCESSFUL ~92% of the time after being "polled"
    once, to mimic realistic demo behaviour without needing a real PIN entry.
    """

    def request_to_pay(self, payer_number, amount, currency, external_id, note=None):
        reference_id = str(uuid.uuid4())
        _MOCK_LEDGER[reference_id] = {
            "type": "collection",
            "payer_number": payer_number,
            "amount": amount,
            "currency": currency,
            "external_id": external_id,
            "note": note,
            "status": "PENDING",
        }
        return {"reference_id": reference_id, "status": "PENDING"}

    def get_payment_status(self, reference_id: str) -> dict:
        record = _MOCK_LEDGER.get(reference_id)
        if not record:
            return {"reference_id": reference_id, "status": "FAILED", "reason": "NOT_FOUND"}
        if record["status"] == "PENDING":
            record["status"] = "SUCCESSFUL" if random.random() < 0.92 else "FAILED"
        return {"reference_id": reference_id, "status": record["status"]}

    def transfer(self, payee_number, amount, currency, external_id, note=None):
        reference_id = str(uuid.uuid4())
        _MOCK_LEDGER[reference_id] = {
            "type": "disbursement",
            "payee_number": payee_number,
            "amount": amount,
            "currency": currency,
            "external_id": external_id,
            "note": note,
            "status": "PENDING",
        }
        return {"reference_id": reference_id, "status": "PENDING"}

    def get_transfer_status(self, reference_id: str) -> dict:
        record = _MOCK_LEDGER.get(reference_id)
        if not record:
            return {"reference_id": reference_id, "status": "FAILED", "reason": "NOT_FOUND"}
        if record["status"] == "PENDING":
            record["status"] = "SUCCESSFUL" if random.random() < 0.92 else "FAILED"
        return {"reference_id": reference_id, "status": record["status"]}
