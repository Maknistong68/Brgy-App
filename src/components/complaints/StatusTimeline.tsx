import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';
import { formatDateTime } from '@/utils/format';

interface StatusEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  notes?: string;
  created_at: string;
  /** Display name of the person who changed the status */
  changed_by_name?: string;
}

interface StatusTimelineProps {
  entries: StatusEntry[];
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusColor(status: string): string {
  const key = status.toLowerCase().replace(/\s+/g, '_') as keyof typeof colors.status;
  return colors.status[key] ?? colors.grey[500];
}

export function StatusTimeline({ entries }: StatusTimelineProps) {
  if (!entries || entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No status history available.</Text>
      </View>
    );
  }

  // Sort entries by created_at descending (newest first)
  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <View style={styles.container}>
      {sorted.map((entry, index) => {
        const isFirst = index === 0;
        const isLast = index === sorted.length - 1;
        const dotColor = getStatusColor(entry.to_status);

        return (
          <View key={entry.id} style={styles.entryRow}>
            {/* Timeline column */}
            <View style={styles.timelineColumn}>
              {/* Top connecting line */}
              <View
                style={[
                  styles.line,
                  styles.topLine,
                  isFirst && styles.lineHidden,
                ]}
              />
              {/* Dot */}
              <View style={[styles.dot, { backgroundColor: dotColor }]}>
                {isFirst && (
                  <Ionicons name="checkmark" size={10} color={colors.white} />
                )}
              </View>
              {/* Bottom connecting line */}
              <View
                style={[
                  styles.line,
                  styles.bottomLine,
                  isLast && styles.lineHidden,
                ]}
              />
            </View>

            {/* Content column */}
            <View style={[styles.contentColumn, isLast && { paddingBottom: 0 }]}>
              <Text style={[styles.statusLabel, isFirst && styles.statusLabelCurrent]}>
                {formatStatusLabel(entry.to_status)}
              </Text>
              {entry.changed_by_name && (
                <Text style={styles.changedBy}>by {entry.changed_by_name}</Text>
              )}
              {entry.notes && (
                <Text style={styles.notes}>{entry.notes}</Text>
              )}
              <Text style={styles.timestamp}>
                {formatDateTime(entry.created_at)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const DOT_SIZE = 20;

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  entryRow: {
    flexDirection: 'row',
  },
  timelineColumn: {
    width: 40,
    alignItems: 'center',
  },
  line: {
    width: 2,
    backgroundColor: colors.grey[300],
  },
  topLine: {
    height: 12,
  },
  bottomLine: {
    flex: 1,
  },
  lineHidden: {
    backgroundColor: 'transparent',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey[400],
  },
  contentColumn: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  statusLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  statusLabelCurrent: {
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  changedBy: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  notes: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.grey[500],
    marginTop: spacing.xs,
  },
});
