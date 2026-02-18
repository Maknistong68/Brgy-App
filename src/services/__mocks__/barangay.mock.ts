import type { ServiceResponse, BarangaySearchResult } from '../barangay.real';
import type { Profile } from '@/types';
import { MOCK_BARANGAYS } from './barangayData';
import { _updateProfileBarangay } from './profile.mock';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function searchBarangays(
  query: string,
  limit: number = 15,
): Promise<ServiceResponse<BarangaySearchResult[]>> {
  await delay(200);
  const q = query.toLowerCase();
  const results = MOCK_BARANGAYS.filter((b) =>
    b.name.toLowerCase().includes(q),
  ).slice(0, limit);
  return { data: results, error: null };
}

export async function getBarangayByJoinCode(
  code: string,
): Promise<ServiceResponse<BarangaySearchResult>> {
  await delay(200);
  const match = MOCK_BARANGAYS.find(
    (b) => b.join_code.toLowerCase() === code.trim().toLowerCase(),
  );
  if (!match) {
    return { data: null, error: new Error('No barangay found with that join code.') };
  }
  return { data: match, error: null };
}

export async function joinBarangay(
  profileId: string,
  barangayId: string,
): Promise<ServiceResponse<Profile>> {
  await delay(200);
  const profile = _updateProfileBarangay(profileId, barangayId);
  if (!profile) {
    return { data: null, error: new Error('Profile not found.') };
  }
  return { data: profile, error: null };
}

export async function regenerateJoinCode(
  _barangayId: string,
): Promise<ServiceResponse<string>> {
  await delay(200);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { data: code, error: null };
}
