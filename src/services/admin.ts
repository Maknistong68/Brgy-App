import * as mock from './__mocks__/admin.mock';
import * as real from './admin.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types
export type {
  UserFilters,
  AuditLogFilters,
  SystemStats,
  ServiceResponse,
  PaginatedResponse,
} from './admin.real';

// Re-export functions — mock or real based on env var
export const getUsers = USE_MOCK ? mock.getUsers : real.getUsers;
export const updateUserRole = USE_MOCK ? mock.updateUserRole : real.updateUserRole;
export const verifyUser = USE_MOCK ? mock.verifyUser : real.verifyUser;
export const getAuditLogs = USE_MOCK ? mock.getAuditLogs : real.getAuditLogs;
export const getSystemStats = USE_MOCK ? mock.getSystemStats : real.getSystemStats;
export const updateFeeSchedule = USE_MOCK ? mock.updateFeeSchedule : real.updateFeeSchedule;
