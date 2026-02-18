import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS, PAGINATION } from '@/constants';
import type { Profile } from '@/types';
import { UserRole } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileFilters {
  role?: UserRole;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[] | null;
  count: number;
  error: Error | null;
}

export interface FileInput {
  uri: string;
  name: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Profile Service
// ---------------------------------------------------------------------------

/**
 * Fetch a profile by the associated Supabase auth `user_id`.
 */
export async function getProfile(
  userId: string,
): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch a profile by its primary key `id`.
 */
export async function getProfileById(
  profileId: string,
): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update fields on an existing profile.
 */
export async function updateProfile(
  profileId: string,
  updates: Partial<Profile>,
): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Upload an avatar image and update the profile's `avatar_url`.
 *
 * @param profileId  The profile to update.
 * @param file       An object with `uri`, `name`, and `type` (from image picker).
 */
export async function uploadAvatar(
  profileId: string,
  file: FileInput,
): Promise<ServiceResponse<Profile>> {
  try {
    const fileExt = file.name.split('.').pop() ?? 'jpg';
    const filePath = `${profileId}/avatar.${fileExt}`;

    // Upload the file to the avatars bucket
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(filePath, {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as File, {
        upsert: true,
      });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .getPublicUrl(filePath);

    // Persist the URL on the profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * List profiles belonging to a specific barangay with optional filtering and
 * pagination.
 */
export async function getBarangayMembers(
  barangayId: string,
  filters?: ProfileFilters,
): Promise<PaginatedResponse<Profile>> {
  try {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('barangay_id', barangayId)
      .order('last_name', { ascending: true })
      .range(from, to);

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, count: 0, error };
    }

    return { data: data as Profile[], count: count ?? 0, error: null };
  } catch (error) {
    return { data: null, count: 0, error: error as Error };
  }
}
