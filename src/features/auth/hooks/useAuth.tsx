/**
 * Auth Hook
 * Online MBA - Authentication state management
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { User, AuthState } from '../../../core/types';
import { STORAGE_KEYS } from '../../../core/config/constants';
import { mainApi } from '../../../core/api/ApiClient';
import { cacheManager, CacheKeys } from '../../../core/cache/CacheManager';
import { useIsMounted } from '../../../core/hooks/useSafeEffect';

// Import Firebase (lazy loaded to reduce initial bundle)
let auth: import('firebase/auth').Auth | null = null;
let googleProvider: import('firebase/auth').GoogleAuthProvider | null = null;
let firebaseInitPromise: Promise<{ auth: import('firebase/auth').Auth; googleProvider: import('firebase/auth').GoogleAuthProvider }> | null = null;

async function initializeFirebase() {
  if (!firebaseInitPromise) {
    firebaseInitPromise = (async () => {
      const { getAuth, GoogleAuthProvider } = await import('firebase/auth');
      const app = (await import('../../../firebase/config')).default;
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      return { auth: auth!, googleProvider: googleProvider! };
    })();
  }
  return firebaseInitPromise;
}

// Pre-initialize Firebase when this module loads (doesn't block rendering)
initializeFirebase().catch(() => {
  // Silently fail - will retry on actual sign-in attempt
});

// Admin emails list - add emails that should have admin access
const ADMIN_EMAILS = [
  'mohit000pareek@gmail.com',
];

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ============================================
// Auth Context
// ============================================

interface AuthContextValue extends AuthState {
  /** Alias for user - for backward compatibility */
  student: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// Auth Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const isMounted = useIsMounted();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.user);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          // Apply admin email check to stored user
          const user: User = {
            ...parsedUser,
            isAdmin: isAdminEmail(parsedUser.email) || parsedUser.isAdmin || false,
          };
          // Update localStorage if admin status changed
          if (user.isAdmin !== parsedUser.isAdmin) {
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
          }
          if (isMounted()) {
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          }

          // Refresh user data in background
          refreshUserData(user.email);
        } else {
          if (isMounted()) {
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        }
      } catch {
        if (isMounted()) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    loadStoredUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh user data from API
  const refreshUserData = useCallback(async (email: string) => {
    try {
      const response = await mainApi.action<User>('getStudentProfile', {
        studentEmail: email,
      });

      if (response.success && response.data && isMounted()) {
        const user = response.data;
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
        cacheManager.set(CacheKeys.userProfile(email), user);
        setState((prev) => ({
          ...prev,
          user,
          isAuthenticated: true,
        }));
      }
    } catch {
      // Silent fail - use cached data
    }
  }, [isMounted]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('[Auth] Starting Google sign-in...');
      const { auth, googleProvider } = await initializeFirebase();
      const { signInWithPopup } = await import('firebase/auth');

      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupError: unknown) {
        // Handle popup-specific errors with user-friendly messages
        const errorCode = (popupError as { code?: string })?.code;
        if (errorCode === 'auth/popup-blocked') {
          throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
        } else if (errorCode === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in was cancelled. Please try again.');
        } else if (errorCode === 'auth/cancelled-popup-request') {
          // User clicked multiple times, ignore this error
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        throw popupError;
      }
      const firebaseUser = result.user;
      console.log('[Auth] Firebase sign-in successful:', firebaseUser.email);

      if (!firebaseUser.email) {
        throw new Error('No email associated with this account');
      }

      // Try to fetch user profile from backend
      console.log('[Auth] Fetching user profile from backend...');
      let backendUser: Partial<User> = {};

      const response = await mainApi.action<User>('getStudentProfile', {
        studentEmail: firebaseUser.email,
      });
      console.log('[Auth] Backend response:', response);

      // Check if the user exists and is authorized
      if (!response.success || !response.data) {
        // User not found in the system - block login
        console.error('[Auth] User not authorized. Success:', response.success, 'Data:', response.data, 'Error:', response.error);

        // Sign out from Firebase since they're not authorized
        try {
          const { signOut: firebaseSignOut } = await import('firebase/auth');
          await firebaseSignOut(auth);
        } catch (signOutError) {
          console.error('[Auth] Error signing out:', signOutError);
        }

        // Set error state and throw
        const errorMessage = response.error || 'Your email is not registered in the system. Please contact your administrator for access.';

        if (isMounted()) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
        }

        throw new Error(errorMessage);
      }

      backendUser = response.data;

      // Create user object (works even if backend fails)
      const displayName = firebaseUser.displayName || '';
      const nameParts = displayName.split(' ');

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: displayName || backendUser.name || 'User',
        firstName: backendUser.firstName || nameParts[0] || 'User',
        lastName: backendUser.lastName || nameParts.slice(1).join(' ') || '',
        avatar: firebaseUser.photoURL || undefined,
        batch: backendUser.batch || 'default',
        role: backendUser.role || 'student',
        isAdmin: isAdminEmail(firebaseUser.email) || backendUser.isAdmin || false,
        createdAt: backendUser.createdAt || new Date().toISOString(),
        updatedAt: backendUser.updatedAt || new Date().toISOString(),
        ...backendUser,
      };
      console.log('[Auth] User object created:', user);

      // Store user
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      cacheManager.set(CacheKeys.userProfile(user.email), user);

      if (isMounted()) {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        console.log('[Auth] Login successful, state updated');
      }
    } catch (error) {
      console.error('[Auth] Sign-in error:', error);
      const message = error instanceof Error ? error.message : 'Sign in failed';

      // Clear any stored user data on login failure
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.token);
      cacheManager.clear();

      if (isMounted()) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: message,
        });
      }

      throw error;
    }
  }, [isMounted]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { auth } = await initializeFirebase();
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
    } catch {
      // Continue with local sign out
    }

    // Clear local storage and cache
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.token);
    cacheManager.clear();

    if (isMounted()) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [isMounted]);

  // Refresh current user
  const refreshUser = useCallback(async () => {
    if (state.user?.email) {
      await refreshUserData(state.user.email);
    }
  }, [state.user?.email, refreshUserData]);

  // Context value
  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      student: state.user, // Alias for backward compatibility
      signInWithGoogle,
      signOut,
      refreshUser,
    }),
    [state, signInWithGoogle, signOut, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// useAuth Hook
// ============================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// ============================================
// useUser Hook (Convenience)
// ============================================

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

// ============================================
// useIsAdmin Hook (Convenience)
// ============================================

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.isAdmin ?? false;
}

export default useAuth;
