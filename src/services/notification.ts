import * as mock from './__mocks__/notification.mock';
import * as real from './notification.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types
export type {
  CreateNotificationData,
  ServiceResponse,
} from './notification.real';

// Re-export functions — mock or real based on env var
export const getNotifications = USE_MOCK ? mock.getNotifications : real.getNotifications;
export const getUnreadCount = USE_MOCK ? mock.getUnreadCount : real.getUnreadCount;
export const markAsRead = USE_MOCK ? mock.markAsRead : real.markAsRead;
export const markAllAsRead = USE_MOCK ? mock.markAllAsRead : real.markAllAsRead;
export const createNotification = USE_MOCK ? mock.createNotification : real.createNotification;
export const deleteNotification = USE_MOCK ? mock.deleteNotification : real.deleteNotification;
