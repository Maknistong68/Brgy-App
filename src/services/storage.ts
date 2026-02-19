import * as mock from './__mocks__/storage.mock';
import * as real from './storage.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types
export type { FileInput, ServiceResponse } from './storage.real';

// Re-export functions — mock or real based on env var
export const uploadFile = USE_MOCK ? mock.uploadFile : real.uploadFile;
export const getPublicUrl = USE_MOCK ? mock.getPublicUrl : real.getPublicUrl;
export const deleteFile = USE_MOCK ? mock.deleteFile : real.deleteFile;
export const downloadFile = USE_MOCK ? mock.downloadFile : real.downloadFile;
