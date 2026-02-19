import type { Profile } from '@/types';
import { UserRole } from '@/types';
import type {
  ServiceResponse,
  PaginatedResponse,
  ProfileFilters,
  FileInput,
} from '../profile.real';
import {
  profilesByUserId,
  profilesById,
  MOCK_BARANGAY_ID,
  delay,
} from './mockDataStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOrCreateProfile(userId: string): Profile {
  if (profilesByUserId.has(userId)) {
    return profilesByUserId.get(userId)!;
  }
  // Create a dynamic profile for unknown users (e.g. from signUp)
  const now = new Date().toISOString();
  const profile: Profile = {
    id: `profile-dyn-${userId.slice(0, 8)}`,
    user_id: userId,
    barangay_id: null,
    first_name: 'Mock',
    last_name: 'User',
    middle_name: null,
    suffix: null,
    email: 'mock@example.com',
    phone: null,
    role: UserRole.RESIDENT,
    avatar_url: null,
    address: null,
    purok: null,
    date_of_birth: null,
    gender: null,
    civil_status: null,
    is_verified: false,
    verified_at: null,
    verified_by: null,
    created_at: now,
    updated_at: now,
  };
  profilesByUserId.set(userId, profile);
  profilesById.set(profile.id, profile);
  return profile;
}

/**
 * Internal helper used by barangay.mock to update a profile's barangay_id
 * after joining.
 */
export function _updateProfileBarangay(
  profileId: string,
  barangayId: string,
): Profile | null {
  const p = profilesById.get(profileId);
  if (!p) return null;
  p.barangay_id = barangayId;
  p.updated_at = new Date().toISOString();
  return { ...p };
}

// ---------------------------------------------------------------------------
// Mock service functions (same signatures as profile.real.ts)
// ---------------------------------------------------------------------------

export async function getProfile(
  userId: string,
): Promise<ServiceResponse<Profile>> {
  await delay(200);
  return { data: { ...getOrCreateProfile(userId) }, error: null };
}

export async function getProfileById(
  profileId: string,
): Promise<ServiceResponse<Profile>> {
  await delay(200);
  const p = profilesById.get(profileId);
  if (!p) return { data: null, error: new Error('Profile not found.') };
  return { data: { ...p }, error: null };
}

export async function updateProfile(
  profileId: string,
  updates: Partial<Profile>,
): Promise<ServiceResponse<Profile>> {
  await delay(200);
  const p = profilesById.get(profileId);
  if (!p) return { data: null, error: new Error('Profile not found.') };
  Object.assign(p, updates, { updated_at: new Date().toISOString() });
  return { data: { ...p }, error: null };
}

export async function uploadAvatar(
  profileId: string,
  _file: FileInput,
): Promise<ServiceResponse<Profile>> {
  await delay(300);
  const p = profilesById.get(profileId);
  if (!p) return { data: null, error: new Error('Profile not found.') };
  p.avatar_url = 'https://via.placeholder.com/150';
  p.updated_at = new Date().toISOString();
  return { data: { ...p }, error: null };
}

export async function getBarangayMembers(
  barangayId: string,
  filters?: ProfileFilters,
): Promise<PaginatedResponse<Profile>> {
  await delay(200);
  let members = Array.from(profilesById.values()).filter(
    (p) => p.barangay_id === barangayId,
  );

  if (filters?.role) {
    members = members.filter((p) => p.role === filters.role);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    members = members.filter(
      (p) =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q),
    );
  }

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = members.slice(start, start + pageSize);

  return { data: paged.map((p) => ({ ...p })), count: members.length, error: null };
}
