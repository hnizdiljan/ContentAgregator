from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.crud import crud_user
from app.schemas.token import TokenData
from app.core import security
from app.core.config import settings

# Define the OAuth2 scheme
# tokenUrl should point to your login endpoint relative to the base path
# Example: if login is at /api/v1/auth/login, tokenUrl="auth/login"
reusable_oauth2 = OAuth2PasswordBearer(
    # tokenUrl=f"{settings.API_V1_STR}/auth/login" # Assuming settings.API_V1_STR is defined
    # Use relative path since API_V1_STR is not in settings
    tokenUrl="auth/login" 
)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> Optional[User]:
    """Dependency to get the current user based on the provided token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = security.decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
        
    token_data = TokenData(username=username)
    
    user = crud_user.get_user_by_email(db, email=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user 