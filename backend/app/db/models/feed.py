from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base
# No longer need direct user relation here
# from .user import User 
from .user_feed import UserFeed # Import association model if needed for type hints


class Feed(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False, index=True, unique=True) # Add unique=True
    title = Column(String, nullable=True) # Keep canonical title
    created_at = Column(DateTime, default=datetime.utcnow)
    # user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Remove this

    # owner = relationship("User", back_populates="feeds") # Remove this
    articles = relationship("Article", back_populates="feed", cascade="all, delete-orphan")

    # New M:N relationship via UserFeed
    subscribers = relationship("UserFeed", back_populates="feed")

    # Add unique constraint explicitly if needed (some DBs might infer from unique=True)
    __table_args__ = (UniqueConstraint('url', name='_feed_url_uc'),)


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    link = Column(String, unique=True, index=True, nullable=False) # Unique constraint on link to avoid duplicates
    description = Column(Text, nullable=True) # Adding description
    published_at = Column(DateTime, nullable=True)
    feed_id = Column(Integer, ForeignKey("feeds.id"), nullable=False)

    # New fields for generated content
    short_summary = Column(Text, nullable=True)
    blog_post = Column(Text, nullable=True)
    short_summary_audio_path = Column(String, nullable=True)
    blog_post_audio_path = Column(String, nullable=True)

    feed = relationship("Feed", back_populates="articles") 