import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStatusHistory } from '@/services/document';
import { Button, LoadingSpinner } from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatDateTime, getStatusLabel } from '@/utils/format';
import { getStatusColor } from '@/utils/status';
import type { DocumentRequestStatusHistory, Profile } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HistoryEntry = DocumentRequestStatusHistory & {
  changed_by_profile?: Profile;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function DocumentHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    try {
      const result = await getStatusHistory(id);
      if (result.data) {
        // Reverse so most recent is at the top
        setHistory([...result.data].reverse());
      }
    } catch (err) {
      console.error('Failed to fetch status history:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  if (loading) {
    return <LoadingSpinner label="Loading history..." />;
  }

  if (history.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="time-outline" size={48} color={colors.grey[300]} />
        <Text style={styles.emptyTitle}>No History</Text>
        <Text style={styles.emptySubtitle}>
          No status changes have been recorded for this document request yet.
        </Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
          />
        }
      >
        {/* Title */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Status History</Text>
          <Text style={styles.headerSubtitle}>
            {history.length} status change{history.length !== 1 ? 's' : ''} recorded
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {history.map((entry, index) => {
            const isFirst = index === 0;
            const isLast = index === history.length - 1;
            const dotColor = isFirst ? colors.success.main : colors.grey[400];
            const lineColor = colors.grey[300];

            const changedByName = entry.changed_by_profile
              ? `${entry.changed_by_profile.first_name} ${entry.changed_by_profile.last_name}`
              : 'System';

            return (
              <View key={entry.id} style={styles.timelineItem}>
                {/* Left: dot + line */}
                <View style={styles.timelineLeft}>
                  {/* Top line segment (hidden for first item) */}
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: isFirst ? 'transparent' : lineColor,
                      },
                    ]}
                  />
                  {/* Dot */}
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: dotColor },
                      isFirst && styles.timelineDotCurrent,
                    ]}
                  >
                    {isFirst && (
                      <View style={styles.timelineDotInner} />
                    )}
                  </View>
                  {/* Bottom line segment (hidden for last item) */}
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: isLast ? 'transparent' : lineColor,
                        flex: 1,
                      },
                    ]}
                  />
                </View>

                {/* Right: content */}
                <View
                  style={[
                    styles.timelineContent,
                    isFirst && styles.timelineContentCurrent,
                  ]}
                >
                  {/* Status badges */}
                  <View style={styles.statusTransition}>
                    {entry.previous_status ? (
                      <>
                        <StatusChip
                          status={entry.previous_status}
                          isMuted
                        />
                        <Ionicons
                          name="arrow-forward"
                          size={14}
                          color={colors.text.secondary}
                        />
                      </>
                    ) : null}
                    <StatusChip status={entry.new_status} />
                  </View>

                  {/* Changed by */}
                  <View style={styles.changedByRow}>
                    <Ionicons
                      name="person-outline"
                      size={12}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.changedByText}>{changedByName}</Text>
                  </View>

                  {/* Notes */}
                  {entry.notes && (
                    <Text style={styles.notesText}>{entry.notes}</Text>
                  )}

                  {/* Date */}
                  <Text style={styles.dateText}>
                    {formatDateTime(entry.created_at)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Status Chip Component
// ---------------------------------------------------------------------------

function StatusChip({
  status,
  isMuted = false,
}: {
  status: string;
  isMuted?: boolean;
}) {
  const baseColor = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <View
      style={[
        chipStyles.chip,
        {
          backgroundColor: isMuted ? colors.grey[100] : baseColor + '1A',
          borderColor: isMuted ? colors.grey[300] : baseColor + '40',
        },
      ]}
    >
      <Text
        style={[
          chipStyles.chipText,
          { color: isMuted ? colors.text.secondary : baseColor },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  // Timeline
  timeline: {
    paddingLeft: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    minHeight: 16,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineDotCurrent: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.success.light,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  // Timeline content
  timelineContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  timelineContentCurrent: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success.main,
  },
  statusTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  changedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  changedByText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 20,
    backgroundColor: colors.grey[50],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.text.disabled,
    marginTop: spacing.xs,
  },
});
