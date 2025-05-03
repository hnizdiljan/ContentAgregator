from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base
from .user_feed import UserFeed # Import association model

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # OpenAI Settings
    openai_api_key_encrypted = Column(String, nullable=True) # Store encrypted API key
    openai_text_model = Column(String, nullable=True)        # User's preferred text model
    openai_tts_model = Column(String, nullable=True)         # User's preferred TTS model

    # Old Relationship (remove)
    # feeds = relationship("Feed", back_populates="owner") 

    # New M:N relationship via UserFeed
    subscriptions = relationship("UserFeed", back_populates="user") 