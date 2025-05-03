from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os # Import os
from pathlib import Path # Import Path
from cryptography.fernet import Fernet # Import Fernet
from dotenv import load_dotenv # Import load_dotenv

# Calculate the path to the .env file relative to this config file
_config_file_path = Path(__file__).resolve()
_project_root = _config_file_path.parent.parent.parent # core -> app -> backend -> project root
_env_path_absolute = _project_root / ".env"

# Load the .env file if it exists
if _env_path_absolute.exists():
    load_dotenv(dotenv_path=_env_path_absolute)
    print(f"[DEBUG] Loaded environment variables from: {_env_path_absolute}")
else:
    print(f"[WARNING] .env file not found at: {_env_path_absolute}, settings will rely on environment variables or defaults.")


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

    # We no longer explicitly need Pydantic to look for the file.
    # `extra='ignore'` prevents errors if other env vars exist that aren't defined in Settings.
    model_config = SettingsConfigDict(extra="ignore")

# Remove the previous debugging prints as load_dotenv provides feedback
# print(f"[DEBUG] Current Working Directory: {os.getcwd()}")
# _env_path_str = "../../.env"
# _absolute_env_path = Path(os.getcwd()) / _env_path_str
# print(f"[DEBUG] Calculated .env path (relative): {_env_path_str}")
# print(f"[DEBUG] Calculated .env path (absolute): {_absolute_env_path.resolve()}")
# print(f"[DEBUG] Does .env exist at calculated path? {_absolute_env_path.exists()}")
# < --- End Debugging prints ---

settings = Settings() 