import { supabase } from '@/lib/supabase';
import type { Barangay, Profile } from '@/types';

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface BarangaySearchResult {
  id: string;
  name: string;
  municipality: string;
  province: string;
  join_code: string;
}

/**
 * Search barangays by name (server-side ilike).
 */
export async function searchBarangays(
  query: string,
  limit: number = 15,
): Promise<ServiceResponse<BarangaySearchResult[]>> {
  try {
    const { data, error } = await supabase
      .from('barangays')
      .select('id, name, municipality, province, join_code')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(limit);

    if (error) return { data: null, error };
    return { data: data as BarangaySearchResult[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Look up a barangay by its 6-char join code (case-insensitive).
 */
export async function getBarangayByJoinCode(
  code: string,
): Promise<ServiceResponse<BarangaySearchResult>> {
  try {
    const { data, error } = await supabase
      .from('barangays')
      .select('id, name, municipality, province, join_code')
      .ilike('join_code', code.trim())
      .single();

    if (error) return { data: null, error };
    return { data: data as BarangaySearchResult, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Join a barangay by setting the profile's barangay_id.
 */
export async function joinBarangay(
  profileId: string,
  barangayId: string,
): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ barangay_id: barangayId, updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Regenerate the join code for a barangay (admin-only RPC).
 */
export async function regenerateJoinCode(
  barangayId: string,
): Promise<ServiceResponse<string>> {
  try {
    const { data, error } = await supabase.rpc('regenerate_join_code', {
      p_barangay_id: barangayId,
    });

    if (error) return { data: null, error };
    return { data: data as string, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
