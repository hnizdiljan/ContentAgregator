from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.models.feed import Article
from app.schemas.article import ArticleCreate


def get_articles_by_feed(db: Session, feed_id: int, skip: int = 0, limit: int = 100) -> List[Article]:
    """Retrieve articles for a specific feed with pagination."""
    return db.query(Article).filter(Article.feed_id == feed_id).order_by(Article.published_at.desc().nullslast(), Article.id.desc()).offset(skip).limit(limit).all()

def get_multi_by_feed_ids(db: Session, *, feed_ids: List[int], skip: int = 0, limit: int = 100) -> List[Article]:
    """Retrieve articles for a list of feed IDs with pagination, ordered by published date descending."""
    if not feed_ids: # Pokud je seznam prázdný, vrátíme prázdný seznam článků
        return []
    return db.query(Article)\
             .filter(Article.feed_id.in_(feed_ids))\
             .order_by(Article.published_at.desc().nullslast(), Article.id.desc())\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_article(db: Session, article_id: int) -> Optional[Article]:
    """Get a single article by its ID."""
    return db.query(Article).filter(Article.id == article_id).first()

def create_article(db: Session, article: ArticleCreate) -> Optional[Article]:
    """Create a new article, checking for duplicates based on link."""
    # Check if an article with the same link already exists for this feed
    existing_article = db.query(Article).filter(Article.feed_id == article.feed_id, Article.link == article.link).first()
    if existing_article:
        # Optionally update existing article fields if needed, or just return None/existing
        return None # Indicate that the article already exists and wasn't newly created

    db_article = Article(
        title=article.title,
        link=article.link,
        description=article.description,
        published_at=article.published_at,
        feed_id=article.feed_id
    )
    db.add(db_article)
    try:
        db.commit()
        db.refresh(db_article)
        return db_article
    except IntegrityError:
        db.rollback() # Rollback in case of other integrity errors (though link check should cover most)
        # Log error or handle appropriately
        print(f"IntegrityError creating article for feed {article.feed_id} with link {article.link}")
        return None

def update_article(db: Session, *, db_obj: Article, obj_in: Dict[str, Any]) -> Article:
    """Updates an article instance."""
    # obj_data = jsonable_encoder(db_obj)
    # if isinstance(obj_in, dict):
    #     update_data = obj_in
    # else:
    #     update_data = obj_in.model_dump(exclude_unset=True)
    
    # Directly update fields from the dictionary
    for field, value in obj_in.items():
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)
        # else: print warning or raise error if field doesn't exist?
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_article_by_link(db: Session, feed_id: int, link: str) -> Optional[Article]:
    """Get a single article by its link and feed_id."""
    return db.query(Article).filter(Article.feed_id == feed_id, Article.link == link).first()

def bulk_create_articles(db: Session, articles: List[ArticleCreate]) -> int:
    """Creates multiple articles efficiently, skipping duplicates based on link within the same feed."""
    count = 0
    existing_links = set(
        r[0] for r in db.query(Article.link).filter(
            Article.feed_id == articles[0].feed_id, # Assuming all articles are for the same feed
            Article.link.in_([a.link for a in articles])
        ).all()
    )

    new_articles = []
    for article in articles:
        if article.link not in existing_links:
            db_article = Article(
                title=article.title,
                link=article.link,
                description=article.description,
                published_at=article.published_at,
                feed_id=article.feed_id
            )
            new_articles.append(db_article)
            existing_links.add(article.link) # Add to set to handle potential duplicates within the input list

    if new_articles:
        db.add_all(new_articles)
        try:
            db.commit()
            count = len(new_articles)
            # Note: db.refresh() doesn't work directly with add_all in the same way
            # If created objects with generated IDs are needed immediately, might need individual commits or other strategies.
        except IntegrityError as e:
            db.rollback()
            print(f"IntegrityError during bulk article creation: {e}")
            # Potentially retry individually or log failures
            return 0 # Indicate failure or partial success differently if needed

    return count 