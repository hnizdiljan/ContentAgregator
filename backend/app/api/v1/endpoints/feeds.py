from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Body
from sqlalchemy.orm import Session
from typing import List, Optional

from app import schemas # Keep this for other schemas like Article
from app.crud import crud_feed, crud_article # Import specific CRUD modules
from app.db.session import get_db
# from app.api.v1.endpoints.users import get_current_user # Use deps directly
from app.api.deps import get_current_active_user # Import dependency
from app.db.models.user import User # Import User model for dependency type hint
from app.schemas.feed import FeedSubscribe, UserFeedSubscription, Feed # Import necessary schemas
from app.services import feed_service # Import the service

router = APIRouter()

@router.get("/subscriptions", response_model=List[UserFeedSubscription])
def list_feed_subscriptions(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Lists all feed subscriptions for the current user."""
    subscriptions = crud_feed.get_user_subscriptions(db, user_id=current_user.id)
    # Manually construct the response if relationship loading isn't perfect
    # response = [
    #     UserFeedSubscription(
    #         feed_id=sub.feed_id,
    #         user_title=sub.user_title,
    #         subscribed_at=sub.subscribed_at,
    #         feed=Feed.from_orm(sub.feed) # Requires Feed schema to have Config.orm_mode = True
    #     ) for sub in subscriptions
    # ]
    return subscriptions # Relying on from_attributes and relationship loading

@router.post("/subscriptions", response_model=UserFeedSubscription, status_code=status.HTTP_201_CREATED)
def subscribe_to_feed(
    feed_in: FeedSubscribe,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Subscribes the current user to a feed by URL. Creates the feed if it doesn't exist."""
    # 1. Get or create the feed entity
    # Potentially fetch title async later if not provided/found
    db_feed = crud_feed.get_or_create_feed(db, url=feed_in.url, title=None)
    if not db_feed:
        # This case shouldn't happen with get_or_create
        raise HTTPException(status_code=500, detail="Failed to get or create feed")

    # 2. Add the subscription for the user
    db_subscription = crud_feed.add_subscription(db, user=current_user, feed=db_feed, user_title=feed_in.user_title)

    if not db_subscription:
        # This might happen if IntegrityError occurs and fetching fails
        # Or if add_subscription decides not to return the existing one
        existing_sub = crud_feed.get_subscription(db, user_id=current_user.id, feed_id=db_feed.id)
        if existing_sub:
           return existing_sub # Return existing if found after potential conflict
        raise HTTPException(status_code=500, detail="Failed to add subscription")

    return db_subscription

@router.delete("/subscriptions/{feed_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe_from_feed(
    feed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Unsubscribes the current user from a specific feed."""
    success = crud_feed.remove_subscription(db, user_id=current_user.id, feed_id=feed_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return None

@router.put("/subscriptions/{feed_id}", response_model=UserFeedSubscription)
def update_subscription(
    feed_id: int,
    user_title: Optional[str] = Body(None, embed=True, alias="userTitle"), # Expect {"userTitle": "New Title"} or {"userTitle": null}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Updates the user-specific title for a feed subscription."""
    if user_title is None:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New title must be provided in the request body as 'userTitle'. Set to null or empty string to clear.")

    updated_sub = crud_feed.update_subscription_title(db, user_id=current_user.id, feed_id=feed_id, new_title=user_title)
    if not updated_sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return updated_sub

@router.post("/{feed_id}/refresh", status_code=status.HTTP_202_ACCEPTED)
async def refresh_feed(
    feed_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user) # Check if user is subscribed
):
    """Triggers a background task to refresh the feed content (if user is subscribed)."""
    # Fetch the subscription to ensure user has access
    subscription = crud_feed.get_subscription(db, user_id=current_user.id, feed_id=feed_id)
    if not subscription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feed not found or user not subscribed")

    # Use background tasks for potentially long-running refresh
    # Pass the feed object from the subscription
    background_tasks.add_task(feed_service.refresh_feed_content, db, subscription.feed)

    return {"message": "Feed refresh scheduled"}

@router.get("/{feed_id}/articles", response_model=List[schemas.Article])
def list_feed_articles(
    feed_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user) # Check if user is subscribed
):
    """Lists articles for a specific feed the current user is subscribed to."""
    # Fetch the subscription to ensure user has access
    subscription = crud_feed.get_subscription(db, user_id=current_user.id, feed_id=feed_id)
    if not subscription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feed not found or user not subscribed")

    articles = crud_article.get_articles_by_feed(db, feed_id=feed_id, skip=skip, limit=limit)
    return articles

# Remove or comment out old endpoints if they are replaced
# @router.get("/", ...)
# @router.post("/", ...)
# @router.delete("/{feed_id}", ...) 