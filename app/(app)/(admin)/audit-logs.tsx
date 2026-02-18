import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
} from '@/theme';
import FilterChip from '@/components/ui/FilterChip';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { getAuditLogs } from '@/services/admin';
import type { AuditLog, Profile } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuditLogEntry = AuditLog & { actor?: Profile };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_FILTERS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Create', value: 'INSERT' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
];

const ACTION_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  INSERT: { icon: 'add-circle', color: colors.success.main },
  UPDATE: { icon: 'create', color: colors.info.main },
  DELETE: { icon: 'trash', color: colors.error.main },
};

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuditLogsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const barangayId = profile?.barangay_id ?? '';

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ---------- Data Fetching ----------

  const fetchLogs = useCallback(
    async (pageNum: number = 1, isRefresh: boolean = false) => {
      if (!barangayId) return;

      try {
        const res = await getAuditLogs({
          barangayId,
          action: actionFilter ?? undefined,
          page: pageNum,
          pageSize: PAGE_SIZE,
        });

        if (res.data) {
          if (pageNum === 1 || isRefresh) {
            setLogs(res.data);
          } else {
            setLogs((prev) => [...prev, ...res.data!]);
          }
          setTotalCount(res.count);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [barangayId, actionFilter],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setExpandedIds(new Set());
    fetchLogs(1, true);
  }, [fetchLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setExpandedIds(new Set());
    await fetchLogs(1, true);
    setRefreshing(false);
  }, [fetchLogs]);

  const onLoadMore = useCallback(() => {
    if (logs.length < totalCount && !loadingMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(nextPage);
    }
  }, [logs.length, totalCount, page, loadingMore, fetchLogs]);

  // ---------- Expand / Collapse ----------

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ---------- Helpers ----------

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActorName = (entry: AuditLogEntry): string => {
    if (entry.actor) {
      return `${entry.actor.first_name} ${entry.actor.last_name}`;
    }
    return 'System';
  };

  const formatJson = (obj?: Record<string, any> | null): string => {
    if (!obj || Object.keys(obj).length === 0) return 'No data';
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return 'Unable to parse';
    }
  };

  // ---------- Renders ----------

  const renderLogItem = ({ item }: { item: AuditLogEntry }) => {
    const isExpanded = expandedIds.has(item.id);
    const actionInfo = ACTION_ICONS[item.action] ?? {
      icon: 'ellipse' as keyof typeof Ionicons.glyphMap,
      color: colors.grey[500],
    };
    const hasDetails =
      (item.old_values && Object.keys(item.old_values).length > 0) ||
      (item.new_values && Object.keys(item.new_values).length > 0);

    return (
      <Pressable
        style={({ pressed }) => [styles.logCard, pressed && styles.logCardPressed]}
        onPress={() => hasDetails && toggleExpanded(item.id)}
      >
        {/* Header Row */}
        <View style={styles.logRow}>
          <View style={[styles.actionIconWrap, { backgroundColor: actionInfo.color + '18' }]}>
            <Ionicons name={actionInfo.icon} size={18} color={actionInfo.color} />
          </View>

          <View style={styles.logContent}>
            <View style={styles.logHeader}>
              <Text style={styles.actionLabel}>{item.action}</Text>
              <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
            </View>
            <Text style={styles.actorName}>{getActorName(item)}</Text>
            <Text style={styles.resourceInfo} numberOfLines={1}>
              {item.resource_type}
              {item.resource_id ? ` / ${item.resource_id.slice(0, 8)}...` : ''}
            </Text>
          </View>

          {hasDetails && (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.grey[400]}
            />
          )}
        </View>

        {/* Expanded Details */}
        {isExpanded && hasDetails && (
          <View style={styles.detailsSection}>
            {item.old_values && Object.keys(item.old_values).length > 0 && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Previous Values</Text>
                <View style={styles.jsonBlock}>
                  <Text style={styles.jsonText} selectable>
                    {formatJson(item.old_values)}
                  </Text>
                </View>
              </View>
            )}
            {item.new_values && Object.keys(item.new_values).length > 0 && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>New Values</Text>
                <View style={styles.jsonBlock}>
                  <Text style={styles.jsonText} selectable>
                    {formatJson(item.new_values)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  if (loading) {
    return <LoadingSpinner label="Loading audit logs..." />;
  }

  return (
    <View style={styles.container}>
      {/* Action Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {ACTION_FILTERS.map((af) => (
          <FilterChip
            key={af.label}
            label={af.label}
            selected={actionFilter === af.value}
            onPress={() => setActionFilter(af.value)}
          />
        ))}
      </ScrollView>

      {/* Log Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {totalCount} log{totalCount !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Log List */}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={
          logs.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="list-outline" size={48} color={colors.grey[400]} />}
            title="No audit logs"
            description="System activity logs will appear here."
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <LoadingSpinner size="small" label="Loading more..." />
            </View>
          ) : logs.length > 0 && logs.length >= totalCount ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>All logs loaded</Text>
            </View>
          ) : null
        }
      />
    </View>
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
  chipRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  countRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  countText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Log Card
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  logCardPressed: {
    opacity: 0.9,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  actorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginTop: 2,
  },
  resourceInfo: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Expanded Details
  detailsSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  detailBlock: {
    gap: spacing.xs,
  },
  detailTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jsonBlock: {
    backgroundColor: colors.grey[100],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  jsonText: {
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    color: colors.text.primary,
    lineHeight: 18,
  },

  // Footer
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
});
