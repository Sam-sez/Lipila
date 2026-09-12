from abc import ABC, abstractmethod
from typing import Optional


class PaymentProvider(ABC):
    """
    The contract every provider (mock, MTN, aggregator) must satisfy.
    Lipila's routers only ever talk to this interface — never to a
    specific provider's SDK directly — so switching PAYMENT_PROVIDER
    in config is the only change needed to go from mock to real money.
    """

    @abstractmethod
    def request_to_pay(
        self, payer_number: str, amount: float, currency: str, external_id: str, note: Optional[str] = None
    ) -> dict:
        """
        Collections API. Pulls money FROM payer_number.
        Provider pushes its own native PIN prompt to the payer's phone —
        Lipila never sees or stores that PIN.
        Returns: {"reference_id": str, "status": "PENDING"|"SUCCESSFUL"|"FAILED"}
        """
        ...

    @abstractmethod
    def get_payment_status(self, reference_id: str) -> dict:
        """Poll/webhook-equivalent status check for a request_to_pay call."""
        ...

    @abstractmethod
    def transfer(
        self, payee_number: str, amount: float, currency: str, external_id: str, note: Optional[str] = None
    ) -> dict:
        """
        Disbursements API. Pushes money TO payee_number.
        Used for agent-triggered cash-in. Requires the caller (agent) to be
        a verified business account in production.
        Returns: {"reference_id": str, "status": "PENDING"|"SUCCESSFUL"|"FAILED"}
        """
        ...

    @abstractmethod
    def get_transfer_status(self, reference_id: str) -> dict:
        ...
