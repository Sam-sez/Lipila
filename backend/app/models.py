import uuid
import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    """
    A Lipila user. `mobile_number` is the real registered MTN/Airtel number —
    this is what actually receives money. `nickname` is cosmetic only and
    must never be trusted on its own for payment confirmation (see
    verified_display_name in schemas.py) since nicknames are spoofable.
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    mobile_number = Column(String, unique=True, index=True, nullable=False)
    legal_name = Column(String, nullable=False)
    nickname = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    provider = Column(String, default="MTN")  # "MTN" | "AIRTEL" | "ZAMTEL"
    is_merchant = Column(Boolean, default=False)
    is_agent = Column(Boolean, default=False)
    merchant_category = Column(String, nullable=True)  # e.g. "bus", "market_stall", "agent"
    static_qr_token = Column(String, unique=True, default=gen_id)  # fixed, never expires
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    favorites = relationship(
        "Favorite", foreign_keys="Favorite.owner_id", back_populates="owner"
    )

    @property
    def display_name(self):
        """What gets shown before a payment is confirmed. Nickname is shown
        for personality, but always paired with a verified marker so it
        can't be used to impersonate someone else's registered number."""
        base = self.nickname or self.legal_name
        return {
            "name": base,
            "verified_number_suffix": self.mobile_number[-3:],
            "legal_name": self.legal_name,
        }


class Transaction(Base):
    """
    Records the digital transfer only. For agent cash-in/cash-out, Lipila
    can vouch for this record but explicitly cannot vouch for the physical
    cash handoff — that's stated in the API response, not just docs.
    """
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=gen_id)
    payer_id = Column(String, ForeignKey("users.id"), nullable=False)
    payee_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="ZMW")
    method = Column(String, nullable=False)  # "static_qr" | "dynamic_qr" | "bong" | "favorite"
    note = Column(String, nullable=True)
    auto_tag = Column(String, nullable=True)  # "Cash-in" | "Cash-out" | None
    provider_reference = Column(String, nullable=True)  # MTN/Airtel's own txn id
    status = Column(String, default="pending")  # pending | successful | failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    payer = relationship("User", foreign_keys=[payer_id])
    payee = relationship("User", foreign_keys=[payee_id])


class Favorite(Base):
    """An opt-in saved contact. Created only after an explicit
    'Save as favorite?' confirmation post-payment — never automatic."""
    __tablename__ = "favorites"

    id = Column(String, primary_key=True, default=gen_id)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    saved_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="favorites")
    saved_user = relationship("User", foreign_keys=[saved_user_id])
