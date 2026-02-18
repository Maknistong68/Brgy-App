import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';
import { formatDistanceToNow } from 'date-fns';

// ---------------------------------------------------------------------------
// Notification type -> icon mapping
// ---------------------------------------------------------------------------

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const NOTIFICATION_ICONS: Record<string, { name: IoniconsName; color: string; bg: string }> = {
  complaint: { name: 'megaphone-outline', color: colors.warning.main, bg: colors.warning.light + '25' },
  document: { name: 'document-text-outline', color: colors.info.main, bg: colors.info.light + '25' },
  announcement: { name: 'chatbubble-ellipses-outline', color: colors.primary[600], bg: colors.primary[50] },
  system: { name: 'settings-outline', color: colors.grey[600], bg: colors.grey[100] },
  approval: { name: 'checkmark-circle-outline', color: colors.success.main, bg: colors.success.light + '25' },
  rejection: { name: 'close-circle-outline', color: colors.error.main, bg: colors.error.light + '25' },
  reminder: { name: 'alarm-outline', color: colors.secondary[600], bg: colors.secondary[50] },
};

const DEFAULT_ICON: { name: IoniconsName; color: string; bg: string } = {
  name: 'notifications-outline',
  color: colors.secondary[600],
  bg: colors.secondary[50],
};

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] ?? DEFAULT_ICON;
}

// ---------------------------------------------------------------------------
// Notification item
// ---------------------------------------------------------------------------

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  item: Notification;
  onPress: (id: string) => void;
}

function NotificationItem({ item, onPress }: NotificationItemProps) {
  const icon = getNotificationIcon(item.type);

  const relativeTime = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.notificationItem,
        !item.is_read && styles.notificationItemUnread,
        pressed && styles.notificationItemPressed,
      ]}
      onPress={() => onPress(item.id)}
    >
      {/* Unread indicator border */}
      {!item.is_read && <View style={styles.unreadBorder} />}

      <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>

      <View style={styles.notificationContent}>
        <Text
          style={[
            styles.notificationTitle,
            !item.is_read && styles.notificationTitleUnread,
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>{relativeTime}</Text>
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  const handleNotificationPress = useCallback(
    (id: string) => {
      markRead(id);
    },
    [markRead],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem item={item} onPress={handleNotificationPress} />
    ),
    [handleNotificationPress],
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <EmptyState
        icon={
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={colors.grey[300]}
          />
        }
        title="No notifications yet"
        description="When you receive notifications, they will appear here."
      />
    );
  }, [isLoading]);

  // Show full-screen spinner only on the very first load
  if (isLoading && notifications.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            headerRight: () => null,
          }}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner label="Loading notifications..." />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable onPress={markAllRead} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Mark All Read</Text>
              </Pressable>
            ) : null,
        }}
      />

      <View style={styles.container}>
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <Ionicons
              name="mail-unread-outline"
              size={16}
              color={colors.info.dark}
            />
            <Text style={styles.unreadBannerText}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            notifications.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadNotifications}
              colors={[colors.primary[600]]}
              tintColor={colors.primary[600]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Header
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Unread banner
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info.light + '20',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.info.light + '40',
  },
  unreadBannerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.info.dark,
  },

  // Notification item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    position: 'relative',
  },
  notificationItemUnread: {
    backgroundColor: colors.secondary[50] + '60',
  },
  notificationItemPressed: {
    backgroundColor: colors.grey[100],
  },
  unreadBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.secondary[500],
    borderTopLeftRadius: borderRadius.sm,
    borderBottomLeftRadius: borderRadius.sm,
  },

  // Icon
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // Content
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  notificationTitleUnread: {
    fontWeight: fontWeight.bold,
  },
  notificationBody: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: colors.grey[500],
  },

  // Unread dot
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary[500],
    marginTop: spacing.xs + 2,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.md + 44 + spacing.sm, // aligned with content start
  },
});
