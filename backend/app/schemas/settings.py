from pydantic import BaseModel, Field
from typing import Optional

# Schema for updating settings
# API key is optional, user might only want to update models
class SettingsUpdate(BaseModel):
    openai_api_key: Optional[str] = Field(None, description="Set new OpenAI API Key (will be encrypted)")
    openai_text_model: Optional[str] = Field(None, description="Preferred text generation model (e.g., gpt-4, gpt-3.5-turbo)")
    openai_tts_model: Optional[str] = Field(None, description="Preferred TTS model (e.g., tts-1, tts-1-hd)")

# Schema for reading settings
# Excludes the sensitive API key, only indicates if it's set
class Settings(BaseModel):
    openai_api_key_set: bool = Field(..., description="Indicates if a custom OpenAI API key is configured")
    openai_text_model: Optional[str] = Field(None, description="User's preferred text model")
    openai_tts_model: Optional[str] = Field(None, description="User's preferred TTS model")

    class Config:
        from_attributes = True 