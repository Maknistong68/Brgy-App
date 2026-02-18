import * as mock from './__mocks__/barangay.mock';
import * as real from './barangay.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types (identical in both implementations)
export type { ServiceResponse, BarangaySearchResult } from './barangay.real';

// Re-export functions — mock or real based on env var
export const searchBarangays = USE_MOCK ? mock.searchBarangays : real.searchBarangays;
export const getBarangayByJoinCode = USE_MOCK ? mock.getBarangayByJoinCode : real.getBarangayByJoinCode;
export const joinBarangay = USE_MOCK ? mock.joinBarangay : real.joinBarangay;
export const regenerateJoinCode = USE_MOCK ? mock.regenerateJoinCode : real.regenerateJoinCode;
