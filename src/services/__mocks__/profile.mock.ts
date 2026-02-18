import type { Profile } from '@/types';
import { UserRole } from '@/types';
import type {
  ServiceResponse,
  PaginatedResponse,
  ProfileFilters,
  FileInput,
} from '../profile.real';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// In-memory profile store
// ---------------------------------------------------------------------------

const profiles = new Map<string, Profile>();

function getOrCreateProfile(userId: string): Profile {
  if (!profiles.has(userId)) {
    const now = new Date().toISOString();
    profiles.set(userId, {
      id: `profile-${userId.slice(0, 8)}`,
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
    });
  }
  return profiles.get(userId)!;
}

/**
 * Internal helper used by barangay.mock to update a profile's barangay_id
 * after joining.
 */
export function _updateProfileBarangay(
  profileId: string,
  barangayId: string,
): Profile | null {
  for (const [, p] of profiles) {
    if (p.id === profileId) {
      p.barangay_id = barangayId;
      p.updated_at = new Date().toISOString();
      return { ...p };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Mock service functions (same signatures as profile.real.ts)
// ---------------------------------------------------------------------------

export async function getProfile(
  userId: string,
): Promise<ServiceResponse<Profile>> {
  await delay(200);
  return { data: getOrCreateProfile(userId), error: null };
}

export async function getProfileById(
  profileId: string,
): Promise<ServiceResponse<Profile>> {
  await delay(200);
  for (const [, p] of profiles) {
    if (p.id === profileId) return { data: { ...p }, error: null };
  }
  return { data: null, error: new Error('Profile not found.') };
}

export async function updateProfile(
  profileId: string,
  updates: Partial<Profile>,
): Promise<ServiceResponse<Profile>> {
  await delay(200);
  for (const [, p] of profiles) {
    if (p.id === profileId) {
      Object.assign(p, updates, { updated_at: new Date().toISOString() });
      return { data: { ...p }, error: null };
    }
  }
  return { data: null, error: new Error('Profile not found.') };
}

export async function uploadAvatar(
  profileId: string,
  _file: FileInput,
): Promise<ServiceResponse<Profile>> {
  await delay(300);
  for (const [, p] of profiles) {
    if (p.id === profileId) {
      p.avatar_url = 'https://via.placeholder.com/150';
      p.updated_at = new Date().toISOString();
      return { data: { ...p }, error: null };
    }
  }
  return { data: null, error: new Error('Profile not found.') };
}

export async function getBarangayMembers(
  _barangayId: string,
  _filters?: ProfileFilters,
): Promise<PaginatedResponse<Profile>> {
  await delay(200);
  return { data: [], count: 0, error: null };
}
