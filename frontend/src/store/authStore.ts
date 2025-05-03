import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  // Můžeme přidat další info o uživateli, např. email, id, role
  // user: { email: string; id: number } | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null, // Initial state
      // user: null,
      setToken: (token) => {
        console.log('[authStore] setToken called with:', token);
        set({ token });
        // Zde bychom mohli dekódovat token a uložit info o uživateli
        // if (token) { set({ user: decodeToken(token) }); }
        // else { set({ user: null }); }
      },
      logout: () => set({ token: null /*, user: null */ }),
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage', // name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      // Můžeme specifikovat, které části stavu persistovat
      // partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: (state) => {
        return (state, error) => {
          console.log('[authStore] onRehydrateStorage finished. State:', state, 'Error:', error);
          state?.setHasHydrated(true);
        };
      },
    }
  )
);

// Placeholder: Nahradit implementací pro získání tokenu v api.ts
// Toto je jen pro přechodné období, než plně integrujeme Zustand
export const getAuthToken = (): string | null => {
  try {
    const storageValue = localStorage.getItem('auth-storage');
    if (storageValue) {
      const state = JSON.parse(storageValue).state;
      return state.token || null;
    }
  } catch (error) {
    console.error("Failed to parse auth token from localStorage:", error);
  }
  return null;
}; 