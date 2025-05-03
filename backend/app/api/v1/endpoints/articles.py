from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.crud import crud_article
from app.db.session import get_db
from app.services import openai_service
from app.api.deps import get_current_active_user
from app.db.models.user import User

router = APIRouter()

@router.post("/{article_id}/generate-summary", response_model=schemas.Article, tags=["Articles"])
async def generate_summary_for_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Triggers the generation of a short summary for the article."""
    try:
        await openai_service.generate_text_content(db=db, article_id=article_id, content_type="short_summary", current_user=current_user)
        db_article = crud_article.get_article(db=db, article_id=article_id)
        if not db_article:
             # Should not happen if generation succeeded, but check anyway
            raise HTTPException(status_code=404, detail="Article not found after update")
        return db_article
    except HTTPException as e:
        raise e # Re-raise HTTPExceptions from the service
    except Exception as e:
        # Log the error
        print(f"Error in endpoint generate_summary_for_article for {article_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during summary generation.")

@router.post("/{article_id}/generate-blogpost", response_model=schemas.Article, tags=["Articles"])
async def generate_blogpost_for_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Triggers the generation of a blog post for the article."""
    try:
        await openai_service.generate_text_content(db=db, article_id=article_id, content_type="blog_post", current_user=current_user)
        db_article = crud_article.get_article(db=db, article_id=article_id)
        if not db_article:
            raise HTTPException(status_code=404, detail="Article not found after update")
        return db_article
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in endpoint generate_blogpost_for_article for {article_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during blog post generation.")

@router.post("/{article_id}/generate-summary-audio", response_model=schemas.Article, tags=["Articles"])
async def generate_summary_audio(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Triggers the generation of audio for the article's short summary."""
    try:
        await openai_service.generate_audio_for_article(db=db, article_id=article_id, content_type="short_summary", current_user=current_user)
        db_article = crud_article.get_article(db=db, article_id=article_id)
        if not db_article:
            raise HTTPException(status_code=404, detail="Article not found after update")
        return db_article
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in endpoint generate_summary_audio for {article_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during summary audio generation.")

@router.post("/{article_id}/generate-blogpost-audio", response_model=schemas.Article, tags=["Articles"])
async def generate_blogpost_audio(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Triggers the generation of audio for the article's blog post."""
    try:
        await openai_service.generate_audio_for_article(db=db, article_id=article_id, content_type="blog_post", current_user=current_user)
        db_article = crud_article.get_article(db=db, article_id=article_id)
        if not db_article:
            raise HTTPException(status_code=404, detail="Article not found after update")
        return db_article
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in endpoint generate_blogpost_audio for {article_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during blog post audio generation.")

# Endpoint to get a single article (opraven import)
@router.get("/{article_id}", response_model=schemas.Article, tags=["Articles"])
def read_article(
    article_id: int,
    db: Session = Depends(get_db),
):
    """Get a single article by ID."""
    db_article = crud_article.get_article(db=db, article_id=article_id)
    if db_article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return db_article

# Nový endpoint pro načtení článků podle feed_ids (opraven import)
@router.get("/", response_model=List[schemas.Article], tags=["Articles"])
def read_articles(
    *,
    db: Session = Depends(get_db),
    feed_ids: List[int] = Query(None, description="List of feed IDs to filter articles by."),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve articles, optionally filtered by a list of feed IDs.
    Requires authentication.
    """
    if not feed_ids:
        return []

    articles = crud_article.get_multi_by_feed_ids(db=db, feed_ids=feed_ids, skip=skip, limit=limit)
    return articles 