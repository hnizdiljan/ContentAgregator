from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base

class UserFeed(Base):
    __tablename__ = "user_feeds"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    feed_id = Column(Integer, ForeignKey("feeds.id"), primary_key=True)
    user_title = Column(String, nullable=True) # User-specific title for the feed
    subscribed_at = Column(DateTime, default=datetime.utcnow)

    # Define relationships to User and Feed
    user = relationship("User", back_populates="subscriptions")
    feed = relationship("Feed", back_populates="subscribers")

    # Ensure a user can only subscribe to a feed once
    __table_args__ = (UniqueConstraint('user_id', 'feed_id', name='_user_feed_uc'),) 