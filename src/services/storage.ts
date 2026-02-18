import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileInput {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Upload Validation
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text
  'text/plain',
  'text/csv',
];

/**
 * Sanitize a filename by stripping path traversal characters and
 * other potentially dangerous sequences.
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[/\\]/g, '_') // Replace path separators
    .replace(/[<>:"|?*\x00-\x1f]/g, '_') // Remove other dangerous chars
    .trim();
}

/**
 * Validate a file before upload.
 */
function validateFile(file: FileInput): Error | null {
  if (file.size !== undefined && file.size > MAX_FILE_SIZE) {
    return new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return new Error(`File type '${file.type}' is not allowed. Allowed types: images, PDF, Office documents, and text files`);
  }

  if (!file.name || file.name.trim().length === 0) {
    return new Error('File name is required');
  }

  return null;
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
    // Validate file before upload
    const validationError = validateFile(file);
    if (validationError) {
      return { data: null, error: validationError };
    }

    // Sanitize filename in the path
    const sanitizedName = sanitizeFilename(file.name);
    const sanitizedPath = path.replace(file.name, sanitizedName);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(sanitizedPath, {
        uri: file.uri,
        name: sanitizedName,
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
