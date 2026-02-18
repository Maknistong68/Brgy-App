import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { SignUpMetadata, AuthResponse, SessionResponse } from '../auth.real';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// In-memory auth store
// ---------------------------------------------------------------------------

interface MockUserEntry {
  user: User;
  password: string;
}

const users = new Map<string, MockUserEntry>();
let currentSession: Session | null = null;

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;
const listeners = new Set<AuthListener>();

function createMockUser(
  email: string,
  firstName: string,
  lastName: string,
): User {
  const id = `mock-${email.replace(/[^a-z0-9]/gi, '-')}`;
  return {
    id,
    email,
    app_metadata: {},
    user_metadata: { first_name: firstName, last_name: lastName },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    identities: [],
    factors: [],
  } as unknown as User;
}

function createMockSession(user: User): Session {
  return {
    access_token: `mock-access-${user.id}`,
    refresh_token: `mock-refresh-${user.id}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  } as Session;
}

function notifyListeners(event: AuthChangeEvent, session: Session | null) {
  currentSession = session;
  // Notify asynchronously like real Supabase
  setTimeout(() => {
    listeners.forEach((cb) => cb(event, session));
  }, 0);
}

// ---------------------------------------------------------------------------
// Pre-seed two test users
// ---------------------------------------------------------------------------

const mockPassword = `Mock${Date.now().toString(36)}!`;

const user1 = createMockUser('test1@brgyapp.com', 'Juan', 'Dela Cruz');
users.set('test1@brgyapp.com', { user: user1, password: mockPassword });

const user2 = createMockUser('test2@brgyapp.com', 'Maria', 'Santos');
users.set('test2@brgyapp.com', { user: user2, password: mockPassword });

// ---------------------------------------------------------------------------
// Mock auth functions
// ---------------------------------------------------------------------------

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  await delay(300);
  const entry = users.get(email.toLowerCase());
  if (!entry || entry.password !== password) {
    return { data: null, error: new Error('Invalid login credentials') };
  }
  const session = createMockSession(entry.user);
  notifyListeners('SIGNED_IN', session);
  return { data: { user: entry.user, session }, error: null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: SignUpMetadata,
): Promise<AuthResponse> {
  await delay(300);
  const key = email.toLowerCase();
  if (users.has(key)) {
    return { data: null, error: new Error('User already registered') };
  }
  const user = createMockUser(email, metadata.first_name, metadata.last_name);
  users.set(key, { user, password });
  const session = createMockSession(user);
  notifyListeners('SIGNED_IN', session);
  return { data: { user, session }, error: null };
}

export async function signInWithPhone(
  _phone: string,
): Promise<{ data: object | null; error: Error | null }> {
  await delay(200);
  return { data: {}, error: null };
}

export async function verifyOtp(
  _phone: string,
  _token: string,
): Promise<AuthResponse> {
  await delay(200);
  return { data: null, error: new Error('OTP not supported in mock mode') };
}

export async function signOut(): Promise<{ error: Error | null }> {
  await delay(100);
  notifyListeners('SIGNED_OUT', null);
  return { error: null };
}

export async function resetPassword(
  _email: string,
): Promise<{ data: object | null; error: Error | null }> {
  await delay(200);
  return { data: {}, error: null };
}

export async function getSession(): Promise<SessionResponse> {
  await delay(100);
  return { data: { session: currentSession }, error: null };
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  listeners.add(callback);
  return { unsubscribe: () => { listeners.delete(callback); } };
}
