import uuid
import base64
from typing import Optional
import requests
from app.providers.base import PaymentProvider
from app.config import settings


class MTNProvider(PaymentProvider):
    """
    Real MTN MoMo Collections + Disbursements integration.

    Needs three env vars set to actually work (see backend/.env.example):
      MTN_SUBSCRIPTION_KEY, MTN_API_USER, MTN_API_KEY

    Until those are set this will raise clear errors rather than silently
    doing nothing — flip PAYMENT_PROVIDER back to "mock" for demoing
    without credentials.
    """

    def __init__(self):
        self.base_url = settings.MTN_BASE_URL
        self.subscription_key = settings.MTN_SUBSCRIPTION_KEY
        self.api_user = settings.MTN_API_USER
        self.api_key = settings.MTN_API_KEY
        self.target_env = settings.MTN_TARGET_ENVIRONMENT

    def _require_credentials(self):
        if not (self.subscription_key and self.api_user and self.api_key):
            raise RuntimeError(
                "MTN credentials not configured. Set MTN_SUBSCRIPTION_KEY, "
                "MTN_API_USER, MTN_API_KEY as env vars, or set "
                "PAYMENT_PROVIDER=mock to run without real credentials."
            )

    def _get_access_token(self, product: str) -> str:
        """product is 'collection' or 'disbursement' — MTN issues separate
        tokens per product even though the auth mechanics are identical."""
        self._require_credentials()
        credentials = base64.b64encode(f"{self.api_user}:{self.api_key}".encode()).decode()
        resp = requests.post(
            f"{self.base_url}/{product}/token/",
            headers={
                "Authorization": f"Basic {credentials}",
                "Ocp-Apim-Subscription-Key": self.subscription_key,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    def request_to_pay(self, payer_number, amount, currency, external_id, note=None):
        self._require_credentials()
        reference_id = str(uuid.uuid4())
        token = self._get_access_token("collection")
        resp = requests.post(
            f"{self.base_url}/collection/v1_0/requesttopay",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Reference-Id": reference_id,
                "X-Target-Environment": self.target_env,
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Content-Type": "application/json",
            },
            json={
                "amount": str(amount),
                "currency": currency,
                "externalId": external_id,
                "payer": {"partyIdType": "MSISDN", "partyId": payer_number},
                "payerMessage": note or "Lipila payment",
                "payeeNote": note or "Lipila payment",
            },
            timeout=15,
        )
        resp.raise_for_status()
        return {"reference_id": reference_id, "status": "PENDING"}

    def get_payment_status(self, reference_id: str) -> dict:
        token = self._get_access_token("collection")
        resp = requests.get(
            f"{self.base_url}/collection/v1_0/requesttopay/{reference_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Target-Environment": self.target_env,
                "Ocp-Apim-Subscription-Key": self.subscription_key,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"reference_id": reference_id, "status": data.get("status", "PENDING")}

    def transfer(self, payee_number, amount, currency, external_id, note=None):
        self._require_credentials()
        reference_id = str(uuid.uuid4())
        token = self._get_access_token("disbursement")
        resp = requests.post(
            f"{self.base_url}/disbursement/v1_0/transfer",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Reference-Id": reference_id,
                "X-Target-Environment": self.target_env,
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Content-Type": "application/json",
            },
            json={
                "amount": str(amount),
                "currency": currency,
                "externalId": external_id,
                "payee": {"partyIdType": "MSISDN", "partyId": payee_number},
                "payerMessage": note or "Lipila cash-in",
                "payeeNote": note or "Lipila cash-in",
            },
            timeout=15,
        )
        resp.raise_for_status()
        return {"reference_id": reference_id, "status": "PENDING"}

    def get_transfer_status(self, reference_id: str) -> dict:
        token = self._get_access_token("disbursement")
        resp = requests.get(
            f"{self.base_url}/disbursement/v1_0/transfer/{reference_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Target-Environment": self.target_env,
                "Ocp-Apim-Subscription-Key": self.subscription_key,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"reference_id": reference_id, "status": data.get("status", "PENDING")}
