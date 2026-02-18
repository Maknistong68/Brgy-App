import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatRelativeTime } from '@/utils/format';
import type { RecentActivityItem } from '@/services/dashboard';

interface RecentActivityListProps {
  items: RecentActivityItem[];
}

export function RecentActivityList({ items }: RecentActivityListProps) {
  const router = useRouter();

  const handlePress = (item: RecentActivityItem) => {
    if (item.type === 'complaint') {
      router.push(`/(app)/(complaints)/${item.id}` as any);
    } else {
      router.push(`/(app)/(documents)/${item.id}` as any);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {items.length > 0 ? (
        items.map((item) => (
          <Pressable
            key={`${item.type}-${item.id}`}
            style={({ pressed }) => [
              styles.activityCard,
              pressed && styles.activityCardPressed,
            ]}
            onPress={() => handlePress(item)}
          >
            <View
              style={[
                styles.activityIcon,
                {
                  backgroundColor:
                    item.type === 'complaint'
                      ? colors.error.light + '20'
                      : colors.secondary[50],
                },
              ]}
            >
              <Ionicons
                name={
                  item.type === 'complaint'
                    ? 'megaphone-outline'
                    : 'document-text-outline'
                }
                size={18}
                color={
                  item.type === 'complaint'
                    ? colors.error.main
                    : colors.secondary[600]
                }
              />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityTopRow}>
                <Text style={styles.activityRef} numberOfLines={1}>
                  {item.reference_number}
                </Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.title.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.activityTime}>
                {formatRelativeTime(item.created_at)}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.grey[400]}
            />
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="pulse-outline" size={32} color={colors.grey[300]} />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  activityCardPressed: {
    opacity: 0.85,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityRef: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  activityTitle: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  activityTime: {
    fontSize: fontSize.xs,
    color: colors.text.disabled,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});
