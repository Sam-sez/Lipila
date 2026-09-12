from pydantic import BaseModel, Field
from typing import Optional


class UserCreate(BaseModel):
    mobile_number: str
    legal_name: str
    nickname: Optional[str] = None
    photo_url: Optional[str] = None
    provider: str = "MTN"
    is_merchant: bool = False
    is_agent: bool = False
    merchant_category: Optional[str] = None


class UserOut(BaseModel):
    id: str
    mobile_number: str
    legal_name: str
    nickname: Optional[str]
    photo_url: Optional[str]
    provider: str
    is_merchant: bool
    is_agent: bool
    static_qr_token: str

    class Config:
        from_attributes = True


class DisplayIdentity(BaseModel):
    """What the payer sees on the confirm screen before entering a PIN."""
    user_id: str
    name: str
    verified_number_suffix: str
    photo_url: Optional[str] = None


class StaticQRResolve(BaseModel):
    qr_token: str


class DynamicQRCreate(BaseModel):
    payee_id: str
    amount: float = Field(gt=0)
    note: Optional[str] = None


class DynamicQROut(BaseModel):
    qr_token: str
    payee: DisplayIdentity
    amount: float
    expires_in_seconds: int


class PaymentConfirm(BaseModel):
    payer_id: str
    payee_id: str
    amount: float = Field(gt=0)
    method: str  # static_qr | dynamic_qr | bong | favorite
    note: Optional[str] = None
    qr_token: Optional[str] = None  # required for static/dynamic
    save_as_favorite: bool = False


class TransactionOut(BaseModel):
    id: str
    payer_id: str
    payee_id: str
    amount: float
    currency: str
    method: str
    note: Optional[str]
    auto_tag: Optional[str]
    status: str
    provider_reference: Optional[str]

    class Config:
        from_attributes = True


class BongAnnounce(BaseModel):
    """A user 'opening Bong' — advertising presence with a signal strength
    reading. Real BLE happens client-side; this endpoint just brokers the
    mutual-match + identity-reveal logic server-side."""
    user_id: str
    session_token: str  # random per-session, generated client-side


class BongScanResult(BaseModel):
    detected_session_token: str
    rssi: int  # signal strength, higher (less negative) = closer


class BongMatchCandidate(BaseModel):
    session_token: str
    identity: DisplayIdentity
    estimated_distance_rank: int  # 1 = closest


class AgentCashIn(BaseModel):
    """Agent scans user's static QR and enters cash received."""
    agent_id: str
    user_qr_token: str
    amount: float = Field(gt=0)


class AgentCashOut(BaseModel):
    """User pays an agent (standard Collections flow, same as any merchant)."""
    user_id: str
    agent_qr_token: str
    amount: float = Field(gt=0)
