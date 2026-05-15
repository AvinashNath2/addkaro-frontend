// auth.store.ts — global authentication state using Zustand
//
// Zustand is a lightweight state management library.
// "Global state" means any component can read or update this state
// without passing it through props — no "prop drilling".
//
// Without Zustand, you'd need to pass `user` from App.tsx down through every
// intermediate component to reach a button deep in the tree. With Zustand,
// any component just calls useAuthStore() and gets the user directly.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/auth.types'

// The shape of the auth store — what data it holds and what actions can change it
interface AuthState {
  user: AuthUser | null  // null = not logged in; AuthUser = logged in

  // setAuth is called right after login/register succeeds.
  // It saves the user into the store AND writes the JWT token to localStorage
  // so the axios interceptor can attach it to every future API request.
  setAuth: (user: AuthUser) => void

  // logout clears the user from the store and removes the token from localStorage.
  // After this, the axios interceptor won't send auth headers and protected
  // API routes will return 401 Unauthorized.
  logout: () => void
}

// create() builds the store. The outer function receives "set" — a function
// that merges new state into the store and triggers re-renders in subscribed components.
//
// persist() is a "middleware" that wraps the store.
// It automatically saves state to localStorage on every change
// and restores it when the page loads — so refreshing the browser doesn't log you out.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      setAuth: (user) => {
        // Write token and userId separately so the axios interceptor can read them.
        // axios.ts reads these keys directly (it can't import the Zustand store
        // without a circular dependency, so plain localStorage is the bridge).
        localStorage.setItem('token', user.token)
        localStorage.setItem('userId', user.userId) // needed for X-User-Id header
        set({ user })
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        set({ user: null })
      },
    }),
    {
      // The key under which the state is saved in localStorage
      name: 'addkaro-auth',

      // partialize controls WHAT gets saved to localStorage.
      // We only save the user object — NOT the functions (setAuth, logout).
      // Functions can't be serialized to JSON anyway; Zustand re-creates them on load.
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
