import { supabase } from '@/lib/supabase';
import { PAGINATION } from '@/constants';
import type { Notification } from '@/types';
import { NotificationType } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Notification Service
// ---------------------------------------------------------------------------

/**
 * Fetch notifications for a user, ordered newest-first with optional
 * limit/offset pagination.
 */
export async function getNotifications(
  userId: string,
  limit: number = PAGINATION.DEFAULT_PAGE_SIZE,
  offset: number = 0,
): Promise<ServiceResponse<Notification[]>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { data: null, error };
    }

    return { data: data as Notification[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Return the number of unread notifications for a user.
 */
export async function getUnreadCount(
  userId: string,
): Promise<ServiceResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return { data: null, error };
    }

    return { data: count ?? 0, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(
  notificationId: string,
): Promise<ServiceResponse<Notification>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Notification, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllAsRead(
  userId: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { error: error ?? null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Create a new notification.
 */
export async function createNotification(
  input: CreateNotificationData,
): Promise<ServiceResponse<Notification>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Notification, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a notification by ID.
 */
export async function deleteNotification(
  id: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    return { error: error ?? null };
  } catch (error) {
    return { error: error as Error };
  }
}
