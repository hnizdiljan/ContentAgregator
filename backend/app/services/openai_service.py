import os
from openai import OpenAI, APIError, APIConnectionError, RateLimitError
from pathlib import Path
from fastapi import HTTPException
from typing import Optional

from app.core.config import settings
from app.db.models.user import User # Import User model
from app.crud import crud_article
from sqlalchemy.orm import Session
from app.core.security import decrypt_data # Import decrypt_data

# --- Global Client (Fallback/Default) ---
# Initialize the global client using the environment variable API key
# This client is used if the user hasn't configured their own key.
global_openai_client: Optional[OpenAI] = None
if settings.OPENAI_API_KEY:
    try:
        global_openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        print("Global OpenAI client initialized using environment variable key.")
    except Exception as e:
        print(f"Warning: Failed to initialize global OpenAI client: {e}")
else:
    print("Warning: OPENAI_API_KEY not set in environment. Global OpenAI client not available.")

# Define base path for storing audio files (adjust as needed)
AUDIO_STORAGE_PATH = Path("static/audio")
AUDIO_STORAGE_PATH.mkdir(parents=True, exist_ok=True) # Ensure directory exists

def _handle_openai_error(e: APIError):
    """Helper function to handle common OpenAI API errors."""
    if isinstance(e, APIConnectionError):
        raise HTTPException(status_code=503, detail=f"OpenAI API connection error: {e}")
    elif isinstance(e, RateLimitError):
        raise HTTPException(status_code=429, detail=f"OpenAI API rate limit exceeded: {e}")
    else:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")

def _get_openai_client_and_models(user: User) -> tuple[OpenAI, str, str]:
    """Gets the appropriate OpenAI client and models for the user."""
    api_key: Optional[str] = None
    client_to_use: Optional[OpenAI] = None

    # 1. Try user-specific key
    if user.openai_api_key_encrypted:
        decrypted_key = decrypt_data(user.openai_api_key_encrypted)
        if decrypted_key:
            api_key = decrypted_key
            try:
                client_to_use = OpenAI(api_key=api_key)
                # print(f"Using OpenAI client initialized with user {user.id}'s key.")
            except Exception as e:
                print(f"Warning: Failed to initialize OpenAI client with user {user.id}'s key: {e}. Falling back.")
                client_to_use = None # Fallback
        else:
            print(f"Warning: Failed to decrypt API key for user {user.id}. Falling back.")

    # 2. Fallback to global client if user key is not set, invalid, or decryption failed
    if not client_to_use:
        if global_openai_client:
            client_to_use = global_openai_client
            # print("Using global OpenAI client.")
        else:
            # No user key and no global key
            raise HTTPException(status_code=503, detail="OpenAI API key not configured for user and no global key is available.")

    # Determine models to use
    text_model = user.openai_text_model or settings.OPENAI_TEXT_MODEL
    tts_model = user.openai_tts_model or settings.OPENAI_TTS_MODEL

    return client_to_use, text_model, tts_model

async def generate_text_content(
    db: Session,
    article_id: int,
    content_type: str, # "short_summary" or "blog_post"
    current_user: User # Add current_user
) -> str:
    """Generates text content (summary or blog post) for an article using user settings."""
    # Get user-specific client and models
    client, text_model, _ = _get_openai_client_and_models(current_user)

    db_article = crud_article.get_article(db=db, article_id=article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Prepare the prompt based on content type
    original_content = db_article.description or db_article.title # Use description or title
    if content_type == "short_summary":
        # Add explicit instruction for Czech language
        prompt = f"Summarize the following text in one or two concise paragraphs. The output must be in Czech:\n\nText: {original_content}"
        max_tokens = 150 # Adjust as needed
    elif content_type == "blog_post":
        # Add explicit instruction for Czech language
        prompt = f"Expand the following text into a short blog post format, adding some context or structure if possible. The output must be in Czech:\n\nText: {original_content}"
        max_tokens = 500 # Adjust as needed
    else:
        raise ValueError("Invalid content_type specified")

    try:
        response = client.chat.completions.create(
            model=text_model,
            messages=[
                # Optionally, add a system message reinforcing the language requirement
                {"role": "system", "content": "You are a helpful assistant that generates content based on provided text, always responding in Czech."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens
        )
        generated_text = response.choices[0].message.content.strip()

        # Update the article in the database
        update_data = {content_type: generated_text}
        # Ensure update_article exists and works correctly
        crud_article.update_article(db=db, db_obj=db_article, obj_in=update_data)

        return generated_text
    except APIError as e:
        _handle_openai_error(e)
    except Exception as e:
        print(f"Error generating text content for article {article_id} by user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate text content.")


async def generate_audio_for_article(
    db: Session,
    article_id: int,
    content_type: str, # "short_summary" or "blog_post"
    current_user: User # Add current_user
) -> str:
    """Generates TTS audio for an article using user settings."""
    # Get user-specific client and models
    client, _, tts_model = _get_openai_client_and_models(current_user)

    db_article = crud_article.get_article(db=db, article_id=article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")

    text_to_speak = getattr(db_article, content_type, None)
    if not text_to_speak:
        raise HTTPException(status_code=400, detail=f"{content_type} content not found for this article. Generate it first.")

    # Define the path for the audio file
    audio_filename = f"article_{article_id}_{content_type.replace('_','')}.mp3"
    speech_file_path = AUDIO_STORAGE_PATH / audio_filename
    relative_audio_path = f"/static/audio/{audio_filename}"

    try:
        # Prepare parameters for the API call
        api_params = {
            "model": tts_model,
            "voice": "nova",   # Changed voice to 'nova' for a more narrative style
            "input": text_to_speak
            # Note: 'instructions' parameter is not currently documented for this endpoint.
            # Parameters like response_format and speed could be added if needed.
        }

        # Add instructions only if the specific model is used
        if tts_model == "gpt-4o-mini-tts":
            api_params["instructions"] = "Speak clearly and engagingly, like reading an audiobook or presenting a podcast segment."
            print(f"Using instructions for gpt-4o-mini-tts model.") # Optional logging
            # Remove the note about instructions not being available if we are adding them
            # The comment was inside the dict before, which is invalid Python syntax.
            # We'll remove it entirely if instructions are potentially added.


        response = client.audio.speech.create(**api_params) # Use dictionary unpacking

        response.stream_to_file(speech_file_path)

        # Update the article in the database with the path
        audio_path_field = f"{content_type}_audio_path"
        update_data = {audio_path_field: relative_audio_path}
        crud_article.update_article(db=db, db_obj=db_article, obj_in=update_data)

        return relative_audio_path
    except APIError as e:
        _handle_openai_error(e)
    except Exception as e:
        print(f"Error generating audio for article {article_id}, type {content_type} by user {current_user.id}: {e}")
        if speech_file_path.exists():
           os.remove(speech_file_path) # Clean up potentially corrupted file
        raise HTTPException(status_code=500, detail="Failed to generate audio content.")

# --- Remove Placeholder CRUD functions --- # This comment might be outdated if CRUD functions were added 