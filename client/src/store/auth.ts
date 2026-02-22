import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    username: string;
    email: string;
    phone: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setAuth: (user: User) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            setAuth: (user) => set({ user, isAuthenticated: true }),
            clearAuth: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'mlcore-auth-storage', // name of the item in the storage (must be unique)
            // By default it uses localStorage to persist the metadata (the user object),
            // but the actual auth token is stored securely in an HTTPOnly cookie by the backend.
        }
    )
);
