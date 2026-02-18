import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  barangay_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix: string | null;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  address: string | null;
  purok: string | null;
  date_of_birth: string | null;
  gender: string | null;
  civil_status: string | null;
  is_verified: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  reset: () => set({ session: null, user: null, profile: null, isLoading: false }),
}));
