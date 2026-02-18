import * as mock from './__mocks__/profile.mock';
import * as real from './profile.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types (identical in both implementations)
export type {
  ServiceResponse,
  PaginatedResponse,
  ProfileFilters,
  FileInput,
} from './profile.real';

// Re-export functions — mock or real based on env var
export const getProfile = USE_MOCK ? mock.getProfile : real.getProfile;
export const getProfileById = USE_MOCK ? mock.getProfileById : real.getProfileById;
export const updateProfile = USE_MOCK ? mock.updateProfile : real.updateProfile;
export const uploadAvatar = USE_MOCK ? mock.uploadAvatar : real.uploadAvatar;
export const getBarangayMembers = USE_MOCK ? mock.getBarangayMembers : real.getBarangayMembers;
