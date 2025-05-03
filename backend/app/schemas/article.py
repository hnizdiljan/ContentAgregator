from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Base schema for article properties
class ArticleBase(BaseModel):
    title: str
    link: str
    description: Optional[str] = None
    published_at: Optional[datetime] = None
    # Add generated content fields (optional)
    short_summary: Optional[str] = None
    blog_post: Optional[str] = None
    short_summary_audio_path: Optional[str] = None
    blog_post_audio_path: Optional[str] = None

# Schema for creating an article (inherits from Base)
# We expect feed_id when creating internally
class ArticleCreate(ArticleBase):
    feed_id: int

# Schema for reading an article (includes ID and relationship info)
class Article(ArticleBase):
    id: int
    feed_id: int
    # Ensure generated fields are included when reading
    short_summary: Optional[str] = None
    blog_post: Optional[str] = None
    short_summary_audio_path: Optional[str] = None
    blog_post_audio_path: Optional[str] = None

    class Config:
        from_attributes = True # Allows mapping from ORM model attributes 