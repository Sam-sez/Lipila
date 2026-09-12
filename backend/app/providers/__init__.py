from app.config import settings
from app.providers.mock_provider import MockProvider
from app.providers.mtn_provider import MTNProvider
from app.providers.base import PaymentProvider


def get_provider() -> PaymentProvider:
    if settings.PAYMENT_PROVIDER == "mtn":
        return MTNProvider()
    return MockProvider()


provider = get_provider()
