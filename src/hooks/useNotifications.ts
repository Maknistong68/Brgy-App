import { useCallback, useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import * as notificationService from '@/services/notification';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Notifications hook.
 *
 * Loads the current user's notifications, maintains unread counts, and
 * subscribes to a Supabase real-time channel so new notifications appear
 * immediately without polling.
 *
 * Usage:
 * ```ts
 * const { notifications, unreadCount, loadNotifications, markRead, markAllRead } = useNotifications();
 * ```
 */
export function useNotifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    addNotification,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    setUnreadCount,
    setLoading,
  } = useNotificationStore();

  const { user, profile } = useAuthStore();

  // -----------------------------------------------------------------------
  // Load notifications from the server
  // -----------------------------------------------------------------------

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const { data, error } = await notificationService.getNotifications(user.id);

      if (error) {
        console.error('Failed to load notifications:', error);
        return;
      }

      if (data) {
        setNotifications(data as any);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // -----------------------------------------------------------------------
  // Mark a single notification as read
  // -----------------------------------------------------------------------

  const markRead = useCallback(
    async (id: string) => {
      // Optimistically update the store
      storeMarkAsRead(id);

      try {
        const { error } = await notificationService.markAsRead(id);
        if (error) {
          console.error('Failed to mark notification as read:', error);
          // Reload to reconcile state on error
          await loadNotifications();
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        await loadNotifications();
      }
    },
    [loadNotifications],
  );

  // -----------------------------------------------------------------------
  // Mark all notifications as read
  // -----------------------------------------------------------------------

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;

    // Optimistically update the store
    storeMarkAllAsRead();

    try {
      const { error } = await notificationService.markAllAsRead(user.id);
      if (error) {
        console.error('Failed to mark all notifications as read:', error);
        await loadNotifications();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      await loadNotifications();
    }
  }, [user?.id, loadNotifications]);

  // -----------------------------------------------------------------------
  // Real-time subscription for new notifications
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!user?.id) return;

    // Load initial notifications
    loadNotifications();

    // Subscribe to real-time inserts on the notifications table for this user
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Add the new notification to the store
          const newNotification = payload.new as any;
          addNotification(newNotification);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // If a notification was marked as read externally, update locally
          const updated = payload.new as any;
          if (updated.is_read) {
            storeMarkAsRead(updated.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    // State
    notifications,
    unreadCount,
    isLoading,

    // Actions
    loadNotifications,
    markRead,
    markAllRead,
  };
}
