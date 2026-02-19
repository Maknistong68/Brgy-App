import type { FileInput, ServiceResponse } from '../storage.real';
import { delay } from './mockDataStore';

// ---------------------------------------------------------------------------
// Validation (mirrors real service)
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

function validateFile(file: FileInput): Error | null {
  if (file.size !== undefined && file.size > MAX_FILE_SIZE) {
    return new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    );
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return new Error(
      `File type '${file.type}' is not allowed. Allowed types: images, PDF, Office documents, and text files`,
    );
  }
  if (!file.name || file.name.trim().length === 0) {
    return new Error('File name is required');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Storage Service (Mock)
// ---------------------------------------------------------------------------

export async function uploadFile(
  bucket: string,
  path: string,
  file: FileInput,
): Promise<ServiceResponse<{ path: string; fullPath: string }>> {
  await delay(300);

  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: validationError };
  }

  return {
    data: {
      path,
      fullPath: `${bucket}/${path}`,
    },
    error: null,
  };
}

export function getPublicUrl(
  bucket: string,
  path: string,
): { data: { publicUrl: string } } {
  return {
    data: {
      publicUrl: `https://placeholder.com/storage/${bucket}/${path}`,
    },
  };
}

export async function deleteFile(
  _bucket: string,
  _path: string,
): Promise<{ error: Error | null }> {
  await delay(100);
  return { error: null };
}

export async function downloadFile(
  _bucket: string,
  _path: string,
): Promise<ServiceResponse<Blob>> {
  await delay(200);
  // Return a minimal mock Blob
  const blob = new Blob(['mock file content'], { type: 'text/plain' });
  return { data: blob, error: null };
}
