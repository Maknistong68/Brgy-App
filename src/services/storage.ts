import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileInput {
  uri: string;
  name: string;
  type: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Storage Service
// ---------------------------------------------------------------------------

/**
 * Upload a file to a Supabase Storage bucket.
 *
 * @param bucket  The storage bucket name.
 * @param path    The destination path inside the bucket.
 * @param file    An object with `uri`, `name`, and `type` (from an image/file picker).
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: FileInput,
): Promise<ServiceResponse<{ path: string; fullPath: string }>> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as File, {
        upsert: false,
      });

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        path: data.path,
        fullPath: data.fullPath ?? `${bucket}/${data.path}`,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get the public URL for a file in a storage bucket.
 *
 * This is a synchronous operation -- it constructs the URL from the bucket
 * and path without making a network request.
 */
export function getPublicUrl(
  bucket: string,
  path: string,
): { data: { publicUrl: string } } {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { data };
}

/**
 * Delete a file from a storage bucket.
 */
export async function deleteFile(
  bucket: string,
  path: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return { error: error ?? null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Download the raw file data from a storage bucket.
 */
export async function downloadFile(
  bucket: string,
  path: string,
): Promise<ServiceResponse<Blob>> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
