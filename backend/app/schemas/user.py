from pydantic import BaseModel, EmailStr
from typing import Optional, List
from .settings import Settings # Import Settings schema
from .feed import UserFeedSubscription # Import the new subscription schema

# Shared properties
class UserBase(BaseModel):
    email: EmailStr

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to receive via API on update (optional for now)
# class UserUpdate(UserBase):
#     password: Optional[str] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True # Pydantic V2 (formerly orm_mode)

# Properties to return to client (excluding password)
class User(UserInDBBase):
    id: int
    is_active: Optional[bool] = None
    # Add settings fields
    openai_text_model: Optional[str] = None
    openai_tts_model: Optional[str] = None
    # Instead of exposing the encrypted key, expose whether it's set
    # We will need a property in the model or logic in CRUD/API to handle this

    # Replace feeds with subscriptions
    subscriptions: List[UserFeedSubscription] = [] # Return list of subscriptions

    class Config:
        from_attributes = True

# Schema to represent user settings read access
class UserWithSettings(User):
     settings: Settings

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str 