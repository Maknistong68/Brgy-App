import * as mock from './__mocks__/dashboard.mock';
import * as real from './dashboard.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types
export type {
  DateRange,
  ComplaintStats,
  DocumentStats,
  RecentActivityItem,
  ResolutionMetrics,
  MonthlyTrendItem,
  ServiceResponse,
} from './dashboard.real';

// Re-export functions — mock or real based on env var
export const getComplaintStats = USE_MOCK ? mock.getComplaintStats : real.getComplaintStats;
export const getDocumentStats = USE_MOCK ? mock.getDocumentStats : real.getDocumentStats;
export const getRecentActivity = USE_MOCK ? mock.getRecentActivity : real.getRecentActivity;
export const getResolutionMetrics = USE_MOCK ? mock.getResolutionMetrics : real.getResolutionMetrics;
export const getMonthlyTrends = USE_MOCK ? mock.getMonthlyTrends : real.getMonthlyTrends;
