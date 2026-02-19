import type { Notification } from '@/types';
import { PAGINATION } from '@/constants';
import type {
  CreateNotificationData,
  ServiceResponse,
} from '../notification.real';
import { notifications, delay } from './mockDataStore';

// ---------------------------------------------------------------------------
// Notification Service (Mock)
// ---------------------------------------------------------------------------

export async function getNotifications(
  userId: string,
  limit: number = PAGINATION.DEFAULT_PAGE_SIZE,
  offset: number = 0,
): Promise<ServiceResponse<Notification[]>> {
  await delay(200);
  const items = Array.from(notifications.values())
    .filter((n) => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(offset, offset + limit);
  return { data: items.map((n) => ({ ...n })), error: null };
}

export async function getUnreadCount(
  userId: string,
): Promise<ServiceResponse<number>> {
  await delay(100);
  const count = Array.from(notifications.values()).filter(
    (n) => n.user_id === userId && !n.is_read,
  ).length;
  return { data: count, error: null };
}

export async function markAsRead(
  notificationId: string,
): Promise<ServiceResponse<Notification>> {
  await delay(100);
  const n = notifications.get(notificationId);
  if (!n) return { data: null, error: new Error('Notification not found') };
  n.is_read = true;
  n.read_at = new Date().toISOString();
  return { data: { ...n }, error: null };
}

export async function markAllAsRead(
  userId: string,
): Promise<{ error: Error | null }> {
  await delay(200);
  const now = new Date().toISOString();
  for (const [, n] of notifications) {
    if (n.user_id === userId && !n.is_read) {
      n.is_read = true;
      n.read_at = now;
    }
  }
  return { error: null };
}

export async function createNotification(
  input: CreateNotificationData,
): Promise<ServiceResponse<Notification>> {
  await delay(200);
  const now = new Date().toISOString();
  const notif: Notification = {
    id: `notif-new-${Date.now()}`,
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data ?? undefined,
    is_read: false,
    created_at: now,
    updated_at: now,
  };
  notifications.set(notif.id, notif);
  return { data: { ...notif }, error: null };
}

export async function deleteNotification(
  id: string,
): Promise<{ error: Error | null }> {
  await delay(100);
  notifications.delete(id);
  return { error: null };
}
