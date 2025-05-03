# Import the user CRUD module and assign it to 'user'
from . import crud_user as user
from . import crud_feed as feed # Import the feed module as 'feed'
# Keep direct article imports for now
from .crud_article import get_articles_by_feed, create_article, get_article_by_link, bulk_create_articles

# Můžeme přidat další CRUD moduly zde, např.:
# from . import crud_item as item

# Optionally define __all__ if needed
# __all__ = ["user", "feed", "item"] 