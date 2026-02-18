import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, AuthSession, Session, User } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignUpMetadata {
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  data: { user: User | null; session: Session | null } | null;
  error: Error | null;
}

export interface SessionResponse {
  data: { session: Session | null };
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------

/**
 * Sign in a user with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Register a new user with email, password, and profile metadata.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: SignUpMetadata,
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
        },
      },
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Send an OTP to the given phone number for passwordless sign-in.
 */
export async function signInWithPhone(
  phone: string,
): Promise<{ data: object | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Verify the OTP token sent to the given phone number.
 */
export async function verifyOtp(
  phone: string,
  token: string,
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ?? null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Send a password-reset email to the given address.
 */
export async function resetPassword(
  email: string,
): Promise<{ data: object | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Retrieve the current session (if any).
 */
export async function getSession(): Promise<SessionResponse> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { data: { session: null }, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: { session: null }, error: error as Error };
  }
}

/**
 * Subscribe to authentication state changes.
 *
 * Returns an object with an `unsubscribe` method that should be called when
 * the listener is no longer needed (e.g. on component unmount).
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: AuthSession | null) => void,
) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
