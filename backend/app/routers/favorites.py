from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/{owner_id}", response_model=list[schemas.DisplayIdentity])
def list_favorites(owner_id: str, db: Session = Depends(get_db)):
    """
    Favorites skip the discovery step (no re-scan, no re-Bong) for repeat
    payments, but never skip biometric + provider PIN — that safety step
    is enforced in payments.py regardless of entry point, not here.
    """
    favs = db.query(models.Favorite).filter_by(owner_id=owner_id).all()
    out = []
    for f in favs:
        d = f.saved_user.display_name
        out.append(
            schemas.DisplayIdentity(
                user_id=f.saved_user.id,
                name=d["name"],
                verified_number_suffix=d["verified_number_suffix"],
                photo_url=f.saved_user.photo_url,
            )
        )
    return out


@router.post("")
def add_favorite(owner_id: str, saved_user_id: str, db: Session = Depends(get_db)):
    """Explicit opt-in add — call this only after the user answers 'yes'
    to the post-payment 'Save as favorite?' prompt, never automatically."""
    if owner_id == saved_user_id:
        raise HTTPException(400, "Cannot favorite yourself")
    exists = db.query(models.Favorite).filter_by(owner_id=owner_id, saved_user_id=saved_user_id).first()
    if exists:
        return {"status": "already_favorited"}
    db.add(models.Favorite(owner_id=owner_id, saved_user_id=saved_user_id))
    db.commit()
    return {"status": "saved"}


@router.delete("/{owner_id}/{saved_user_id}")
def remove_favorite(owner_id: str, saved_user_id: str, db: Session = Depends(get_db)):
    fav = db.query(models.Favorite).filter_by(owner_id=owner_id, saved_user_id=saved_user_id).first()
    if not fav:
        raise HTTPException(404, "Favorite not found")
    db.delete(fav)
    db.commit()
    return {"status": "removed"}
