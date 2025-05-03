from sqlalchemy.orm import Session
from typing import Any, Dict, Optional

from app.db.models.user import User
from app.schemas.user import UserCreate
from app.schemas.settings import SettingsUpdate
from app.core.security import get_password_hash, encrypt_data

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        openai_api_key_encrypted=None,
        openai_text_model=None,
        openai_tts_model=None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_settings(db: Session, db_user: User, settings_in: SettingsUpdate) -> User:
    """Updates the settings for a given user."""
    update_data = settings_in.model_dump(exclude_unset=True)

    if "openai_api_key" in update_data and update_data["openai_api_key"] is not None:
        db_user.openai_api_key_encrypted = encrypt_data(update_data["openai_api_key"])
    elif "openai_api_key" in update_data and update_data["openai_api_key"] is None:
        db_user.openai_api_key_encrypted = None

    if "openai_text_model" in update_data:
        db_user.openai_text_model = update_data["openai_text_model"]
    if "openai_tts_model" in update_data:
        db_user.openai_tts_model = update_data["openai_tts_model"]

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Note: Getting settings is handled when getting the user.
# Decryption of API key happens in the service layer when needed. 