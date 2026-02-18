import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as authService from '@/services/auth';
import * as profileService from '@/services/profile';

/**
 * Authentication hook.
 *
 * - Bootstraps the session on mount and subscribes to auth state changes.
 * - Exposes convenience wrappers around the auth service functions.
 * - Keeps the global auth store in sync.
 *
 * Call once at the root layout level for initialisation; use in any
 * component to access the current auth state and actions.
 */
export function useAuth() {
  const {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    setSession,
    setProfile,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore();

  // Guard against double-click sign in
  const signingIn = useRef(false);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data, error } = await authService.getSession();

        // Don't set initialized on failure — retry on next mount
        if (error) {
          console.error('Auth init error:', error);
          setLoading(false);
          return;
        }

        const initialSession = data?.session ?? null;
        setSession(initialSession);
        if (initialSession?.user) {
          const { data: profileData } = await profileService.getProfile(initialSession.user.id);
          if (profileData) setProfile(profileData as any);
        }
        setInitialized(true);
      } catch (error) {
        console.error('Auth init error:', error);
        // Don't set initialized=true on failure
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        // Fire-and-forget: fetch profile without blocking the auth flow
        profileService.getProfile(session.user.id).then(({ data: profileData }) => {
          if (profileData) setProfile(profileData);
        }).catch(() => {
          // Profile fetch failed — user is still authenticated
        });
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Prevent double-click
    if (signingIn.current) return { data: null, error: new Error('Sign in already in progress') };
    signingIn.current = true;

    setLoading(true);
    try {
      const result = await authService.signInWithEmail(email, password);
      return result;
    } finally {
      setLoading(false);
      signingIn.current = false;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string },
  ) => {
    setLoading(true);
    const result = await authService.signUpWithEmail(email, password, metadata);
    setLoading(false);
    return result;
  };

  const signInWithPhone = async (phone: string) => {
    return authService.signInWithPhone(phone);
  };

  const verifyOtp = async (phone: string, token: string) => {
    setLoading(true);
    const result = await authService.verifyOtp(phone, token);
    setLoading(false);
    return result;
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      reset();
    }
  };

  const resetPassword = async (email: string) => {
    return authService.resetPassword(email);
  };

  return {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    signIn,
    signUp,
    signInWithPhone,
    verifyOtp,
    signOut,
    resetPassword,
    isAuthenticated: !!session,
    role: profile?.role ?? null,
  };
}
