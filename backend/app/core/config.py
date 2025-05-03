from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os # Import os
from cryptography.fernet import Fernet # Import Fernet

# Remove the temporary key generation logic
# DEFAULT_ENCRYPTION_KEY = os.getenv("SETTINGS_ENCRYPTION_KEY")
# if not DEFAULT_ENCRYPTION_KEY:
#     print("WARNING: SETTINGS_ENCRYPTION_KEY not found in environment. Generating a temporary key for development.")
#     DEFAULT_ENCRYPTION_KEY = Fernet.generate_key().decode()


class Settings(BaseSettings):
    # Backend Configuration
    DATABASE_URL: str = "sqlite:///./test.db" # Default to SQLite for local dev
    SECRET_KEY: str = "your_very_secret_key_for_jwt_local_dev_only"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Define the encryption key field - Pydantic will load it from .env
    SETTINGS_ENCRYPTION_KEY: str

    # OpenAI API
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_TEXT_MODEL: str = "gpt-3.5-turbo" # Default text model
    OPENAI_TTS_MODEL: str = "tts-1"          # Default TTS model

    # Azure Storage (for audio files)
    AZURE_STORAGE_CONNECTION_STRING: Optional[str] = None
    AZURE_STORAGE_CONTAINER_NAME: str = "audio-outputs"

    # Worker Queues (Example names)
    FEED_FETCH_QUEUE_NAME: str = "feed-fetch-queue"
    TEXT_GEN_QUEUE_NAME: str = "text-gen-queue"
    AUDIO_GEN_QUEUE_NAME: str = "audio-gen-queue"

    # Configure Pydantic to load from .env file in the parent directory
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

settings = Settings() 