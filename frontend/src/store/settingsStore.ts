import { create } from 'zustand';
import apiClient from '../utils/api';
import { Settings, SettingsUpdate } from '../types/settings';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: SettingsUpdate) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Settings>('/settings');
      set({ settings: response.data, isLoading: false });
    } catch (err: any) { // Use 'any' or a more specific error type
      console.error("Failed to fetch settings:", err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load settings.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateSettings: async (data: SettingsUpdate) => {
    set({ isLoading: true, error: null });
    try {
      // If the API key field is empty string, treat it as wanting to clear the key (send null)
      const payload: SettingsUpdate = {
        ...data,
        openai_api_key: data.openai_api_key === "" ? null : data.openai_api_key,
      };
      const response = await apiClient.put<Settings>('/settings', payload);
      set({ settings: response.data, isLoading: false });
    } catch (err: any) {
      console.error("Failed to update settings:", err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save settings.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage); // Re-throw error to indicate failure to the component
    }
  },
})); 