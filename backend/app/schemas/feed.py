from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class FeedBase(BaseModel):
    url: HttpUrl
    title: Optional[str] = None

class FeedCreate(FeedBase):
    pass

class Feed(FeedBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FeedInDB(Feed):
    pass

# Represents a user's subscription to a feed
class UserFeedSubscription(BaseModel):
    feed_id: int
    user_title: Optional[str] = None # The title given by the user
    subscribed_at: datetime
    feed: Feed # Embed the Feed details

    class Config:
        from_attributes = True

# Schema for creating a new subscription (subscribing to a feed)
class FeedSubscribe(BaseModel):
    url: str
    user_title: Optional[str] = None # User can optionally provide a title on subscribe 