import feedparser
import httpx
from datetime import datetime
import time
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app import crud, schemas


def parse_published_date(entry: Dict) -> Optional[datetime]:
    """Attempts to parse the published date from a feed entry."""
    if 'published_parsed' in entry and entry.published_parsed:
        try:
            # feedparser returns a time.struct_time
            ts = time.mktime(entry.published_parsed)
            return datetime.fromtimestamp(ts)
        except Exception:
            pass # Handle potential errors during conversion
    if 'updated_parsed' in entry and entry.updated_parsed:
        try:
            ts = time.mktime(entry.updated_parsed)
            return datetime.fromtimestamp(ts)
        except Exception:
            pass
    # Add more fallback logic if necessary (e.g., parsing string dates)
    return None

async def fetch_and_parse_feed(feed_url: str) -> Optional[Dict]:
    """Fetches and parses an RSS/Atom feed asynchronously."""
    try:
        async with httpx.AsyncClient() as client:
            # Add headers to mimic a browser, some feeds might require this
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = await client.get(feed_url, headers=headers, follow_redirects=True, timeout=20.0)
            response.raise_for_status() # Raise exception for bad status codes

            # Check content type, feedparser might fail on non-XML types
            content_type = response.headers.get('content-type', '').lower()
            if 'xml' not in content_type and 'html' in content_type:
                print(f"Warning: Content type for {feed_url} is {content_type}, might not be a feed.")
                # Optionally return None or try parsing anyway
                # return None
            if not response.content:
                print(f"Error: Empty content received from {feed_url}")
                return None

        # Parse the feed content
        # Giving feedparser the raw bytes allows it to handle encoding detection better
        feed_data = feedparser.parse(response.content)

        # Basic check if parsing was successful
        if feed_data.bozo:
            # bozo=1 means potential problems, check exception details
            bozo_exception = feed_data.get('bozo_exception', 'Unknown error')
            print(f"Warning: Feedparser encountered problems with {feed_url}. Bozo Exception: {bozo_exception}")
            # Decide if we should still proceed or return None
            # if isinstance(bozo_exception, feedparser.NonXMLContentType): return None

        if not feed_data.entries:
            print(f"Warning: No entries found in feed {feed_url}")
            # Return the feed_data anyway, as it might contain feed-level info like title

        return feed_data

    except httpx.RequestError as exc:
        print(f"HTTP error occurred while fetching {feed_url}: {exc}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred during feed fetching/parsing for {feed_url}: {e}")
        return None

def process_feed_articles(db: Session, feed_id: int, parsed_feed: Dict) -> int:
    """Processes parsed feed entries and saves new articles to the database."""
    articles_to_create = []
    for entry in parsed_feed.entries:
        link = entry.get('link')
        title = entry.get('title', 'No Title')

        if not link:
            print(f"Skipping entry with no link in feed {feed_id}: {title[:50]}...")
            continue

        published_date = parse_published_date(entry)
        description = entry.get('summary') or entry.get('description') # Try both

        article_data = schemas.ArticleCreate(
            title=title,
            link=link,
            description=description,
            published_at=published_date,
            feed_id=feed_id
        )
        articles_to_create.append(article_data)

    if not articles_to_create:
        return 0

    # Use bulk create for efficiency
    created_count = crud.bulk_create_articles(db=db, articles=articles_to_create)
    print(f"Created {created_count} new articles for feed {feed_id}.")
    return created_count

async def refresh_feed_content(db: Session, feed: schemas.Feed) -> int:
    """Refreshes a single feed: fetches, parses, and saves new articles."""
    print(f"Refreshing feed: {feed.id} - {feed.url}")
    parsed_feed = await fetch_and_parse_feed(str(feed.url))

    if parsed_feed:
        # Update feed title if it's missing or different (optional)
        parsed_title = parsed_feed.feed.get('title')
        if parsed_title and parsed_title != feed.title:
            # TODO: Implement crud.update_feed_title(db, feed.id, parsed_title)
            print(f"Feed title mismatch for feed {feed.id}. DB: '{feed.title}', Parsed: '{parsed_title}'. Consider updating.")
            pass # Not implemented yet

        return process_feed_articles(db=db, feed_id=feed.id, parsed_feed=parsed_feed)
    else:
        print(f"Failed to fetch or parse feed: {feed.id} - {feed.url}")
        return 0 # Indicate failure or no new articles found due to fetch error 