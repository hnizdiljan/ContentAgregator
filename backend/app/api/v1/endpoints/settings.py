from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Import specific schemas instead of the whole package
# from app import schemas 
from app.schemas.settings import Settings, SettingsUpdate

from app.db.session import get_db
from app.crud import crud_user
from app.api.deps import get_current_active_user # Dependency for current user
from app.db.models.user import User # Import User model for type hinting

router = APIRouter()

@router.get("/settings", response_model=Settings, tags=["Settings"])
def read_settings(
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve the current user's settings."""
    # Construct the response model. The `from_attributes` in the schema handles mapping.
    # We need to add the `openai_api_key_set` field based on the encrypted value.
    return Settings(
        openai_api_key_set=bool(current_user.openai_api_key_encrypted),
        openai_text_model=current_user.openai_text_model,
        openai_tts_model=current_user.openai_tts_model
    )

@router.put("/settings", response_model=Settings, tags=["Settings"])
def update_settings(
    settings_in: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update the current user's settings."""
    updated_user = crud_user.update_user_settings(db=db, db_user=current_user, settings_in=settings_in)
    # Construct the response model similarly to read_settings
    return Settings(
        openai_api_key_set=bool(updated_user.openai_api_key_encrypted),
        openai_text_model=updated_user.openai_text_model,
        openai_tts_model=updated_user.openai_tts_model
    ) 