import * as mock from './__mocks__/auth.mock';
import * as real from './auth.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types
export type { SignUpMetadata, AuthResponse, SessionResponse } from './auth.real';

// Re-export functions — mock or real based on env var
export const signInWithEmail = USE_MOCK ? mock.signInWithEmail : real.signInWithEmail;
export const signUpWithEmail = USE_MOCK ? mock.signUpWithEmail : real.signUpWithEmail;
export const signInWithPhone = USE_MOCK ? mock.signInWithPhone : real.signInWithPhone;
export const verifyOtp = USE_MOCK ? mock.verifyOtp : real.verifyOtp;
export const signOut = USE_MOCK ? mock.signOut : real.signOut;
export const resetPassword = USE_MOCK ? mock.resetPassword : real.resetPassword;
export const getSession = USE_MOCK ? mock.getSession : real.getSession;
export const onAuthStateChange = USE_MOCK ? mock.onAuthStateChange : real.onAuthStateChange;
