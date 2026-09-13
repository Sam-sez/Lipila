from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=schemas.UserOut)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter_by(mobile_number=payload.mobile_number).first()
    if existing:
        raise HTTPException(400, "A user with this mobile number already exists")
    user = models.User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.get("/by-number/{mobile_number}", response_model=schemas.UserOut)
def get_user_by_number(mobile_number: str, db: Session = Depends(get_db)):
    """
    Lets a returning user resume their existing account by mobile number
    alone — this is a demo-identity prototype with no password, so there's
    no separate 'sign in' form, just recognition of an existing number.
    """
    user = db.query(models.User).filter_by(mobile_number=mobile_number).first()
    if not user:
        raise HTTPException(404, "No account found for this number")
    return user


@router.get("", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()
