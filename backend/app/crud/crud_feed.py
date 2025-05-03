from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.db.models.feed import Feed, Article
from app.db.models.user import User
from app.db.models.user_feed import UserFeed
from app.schemas.feed import FeedSubscribe, FeedCreate
from typing import List, Optional

def get_feed_by_id(db: Session, feed_id: int) -> Optional[Feed]:
    """Gets a feed by its ID, regardless of user."""
    return db.query(Feed).filter(Feed.id == feed_id).first()

def get_feed_by_url(db: Session, url: str) -> Optional[Feed]:
    """Gets a feed by its URL."""
    return db.query(Feed).filter(Feed.url == url).first()

def get_or_create_feed(db: Session, url: str, title: Optional[str] = None) -> Feed:
    """Gets a feed by URL or creates it if it doesn't exist."""
    db_feed = get_feed_by_url(db, url=url)
    if db_feed:
        # Optionally update title if provided and missing?
        if title and not db_feed.title:
             db_feed.title = title
             db.add(db_feed)
             db.commit()
             db.refresh(db_feed)
        return db_feed
    else:
        # Consider fetching the canonical title here if not provided
        # For now, use provided title or None
        db_feed = Feed(url=url, title=title)
        db.add(db_feed)
        db.commit()
        db.refresh(db_feed)
        return db_feed

def get_user_subscriptions(db: Session, user_id: int) -> List[UserFeed]:
    """Gets all feed subscriptions for a user."""
    return db.query(UserFeed).filter(UserFeed.user_id == user_id)\
             .options(joinedload(UserFeed.feed)).all() # Eager load feed details

def get_subscription(db: Session, user_id: int, feed_id: int) -> Optional[UserFeed]:
    """Gets a specific subscription entry."""
    return db.query(UserFeed).filter(UserFeed.user_id == user_id, UserFeed.feed_id == feed_id).first()

def add_subscription(db: Session, user: User, feed: Feed, user_title: Optional[str] = None) -> Optional[UserFeed]:
    """Subscribes a user to a feed."""
    # Check if subscription already exists
    existing_sub = get_subscription(db, user_id=user.id, feed_id=feed.id)
    if existing_sub:
        return existing_sub # Or maybe update the title? Return None? For now return existing.

    # Use provided title or fallback to feed's canonical title
    final_user_title = user_title if user_title is not None else feed.title

    db_subscription = UserFeed(user_id=user.id, feed_id=feed.id, user_title=final_user_title)
    db.add(db_subscription)
    try:
        db.commit()
        db.refresh(db_subscription)
        return db_subscription
    except IntegrityError: # Handles potential race conditions or other issues
        db.rollback()
        return get_subscription(db, user_id=user.id, feed_id=feed.id) # Try fetching again

def remove_subscription(db: Session, user_id: int, feed_id: int) -> bool:
    """Unsubscribes a user from a feed."""
    db_subscription = get_subscription(db, user_id=user_id, feed_id=feed_id)
    if db_subscription:
        db.delete(db_subscription)
        db.commit()
        # Optional: Check if the feed has any subscribers left and delete if not
        # remaining_subs = db.query(UserFeed).filter(UserFeed.feed_id == feed_id).count()
        # if remaining_subs == 0:
        #     db_feed = get_feed_by_id(db, feed_id)
        #     if db_feed:
        #         db.delete(db_feed)
        #         db.commit()
        return True
    return False

def update_subscription_title(db: Session, user_id: int, feed_id: int, new_title: str) -> Optional[UserFeed]:
    """Updates the user-specific title for a subscription."""
    db_subscription = get_subscription(db, user_id=user_id, feed_id=feed_id)
    if db_subscription:
        db_subscription.user_title = new_title
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        return db_subscription
    return None

# --- Deprecated / To be removed --- 
# def get_feed(db: Session, feed_id: int, user_id: int) -> Optional[Feed]:
#     """Get a single feed by ID, ensuring it belongs to the user."""
#     # This is replaced by get_user_subscriptions or get_subscription
#     pass 
# def get_feeds_by_user(db: Session, user_id: int) -> List[Feed]:
#     # Replaced by get_user_subscriptions
#     pass
# def create_feed(db: Session, feed: FeedCreate, user_id: int) -> Feed:
#     # Replaced by get_or_create_feed + add_subscription
#     pass
# def delete_feed(db: Session, feed_id: int, user_id: int) -> bool:
#     # Replaced by remove_subscription
#     pass 