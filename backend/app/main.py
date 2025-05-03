from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Import CORS middleware
from fastapi.staticfiles import StaticFiles # Import StaticFiles

# Import Base and engine for table creation
from app.db.session import Base, engine
from app.db.models import user, feed # Import models to ensure they are registered with Base

# Create database tables
# Note: In production, use migrations (e.g., Alembic)
# Base.metadata.create_all(bind=engine) # Commented out as Alembic handles this now

app = FastAPI(
    title="Content Aggregator & Format Shifter API",
    description="API for managing RSS feeds, generating text summaries/blogposts, and audio versions.",
    version="0.1.0"
)

# CORS Configuration
# Nastavení origins - povol adresy, ze kterých bude frontend přistupovat
# Pro vývoj můžeme povolit localhost s portem Vite (obvykle 5173) nebo "*" (méně bezpečné pro produkci)
origins = [
    "http://localhost:5173",
    "http://localhost", # Pokud by frontend běžel přímo na 80
    "http://127.0.0.1:5173",
    # Můžeš přidat další adresy, pokud bude potřeba
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Povolí posílání cookies/credentials
    allow_methods=["*"],    # Povolí všechny standardní metody (GET, POST, OPTIONS, atd.)
    allow_headers=["*"],    # Povolí všechny standardní hlavičky
)

@app.get("/health", tags=["Health Check"])
def health_check():
    """Check if the API is running."""
    return {"status": "ok"}

# Placeholder for future API routers
# from .api.v1 import users, feeds, items # Example
# app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
# app.include_router(feeds.router, prefix="/api/v1/feeds", tags=["Feeds"])
# app.include_router(items.router, prefix="/api/v1/items", tags=["Items"])

# Import API routers
from app.api.v1.endpoints import users as users_v1
from app.api.v1.endpoints import feeds as feeds_v1
from app.api.v1.endpoints import articles as articles_v1
from app.api.v1.endpoints import settings as settings_v1 # Import settings router

# Include routers
app.include_router(users_v1.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(feeds_v1.router, prefix="/api/v1/feeds", tags=["Feeds"])
app.include_router(articles_v1.router, prefix="/api/v1/articles", tags=["Articles"])
app.include_router(settings_v1.router, prefix="/api/v1", tags=["Settings"]) # Include settings router

# Mount static directory for serving audio files
# Create the directory if it doesn't exist (though openai_service should handle it too)
from pathlib import Path
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static") 