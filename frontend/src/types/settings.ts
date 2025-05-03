// Corresponds to backend schemas.Settings
export interface Settings {
  openai_api_key_set: boolean;
  openai_text_model: string | null;
  openai_tts_model: string | null;
}

// Corresponds to backend schemas.SettingsUpdate
// Note: All fields are optional for update
export interface SettingsUpdate {
  openai_api_key?: string | null; // Send null to clear the key
  openai_text_model?: string | null;
  openai_tts_model?: string | null;
} 