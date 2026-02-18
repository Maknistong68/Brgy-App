import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentStore } from '@/stores/documentStore';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import {
  SearchBar,
  FilterChip,
  StatusBadge,
  Badge,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatDate, getDocumentTypeLabel, getStatusLabel } from '@/utils/format';

const STATUS_FILTERS = [
  { key: null, label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'processing', label: 'Processing' },
  { key: 'for_approval', label: 'For Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'for_release', label: 'For Release' },
  { key: 'released', label: 'Released' },
  { key: 'rejected', label: 'Rejected' },
];

const PAYMENT_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  paid: 'success',
  pending: 'warning',
  waived: 'default',
};

export default function DocumentsListScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { isRoleAtLeast } = usePermissions();
  const isStaff = isRoleAtLeast('staff');
  const {
    documents,
    filters,
    isLoading,
    setDocuments,
    setFilters,
    setLoading,
    setError,
  } = useDocumentStore();
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let query = supabase
        .from('document_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isStaff) {
        query = query.eq('requestor_id', profile.user_id);
      } else {
        query = query.eq('barangay_id', profile.barangay_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.type) {
        query = query.eq('document_type', filters.type);
      }

      if (filters.search) {
        query = query.or(
          `reference_number.ilike.%${filters.search}%,purpose.ilike.%${filters.search}%`,
        );
      }

      const { data, error } = await query.limit(50);
      if (error) {
        setError(error.message);
        return;
      }
      setDocuments(data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, filters, isStaff]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  }, [fetchDocuments]);

  const handleSearch = useCallback(
    (text: string) => {
      setFilters({ search: text });
    },
    [setFilters],
  );

  const handleStatusFilter = useCallback(
    (status: string | null) => {
      setFilters({ status });
    },
    [setFilters],
  );

  const renderDocumentItem = useCallback(
    ({ item }: { item: any }) => (
      <Pressable
        style={({ pressed }) => [
          styles.documentCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push(`/(app)/(documents)/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.referenceNumber}>{item.reference_number}</Text>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.badgeRow}>
          <Badge
            label={getDocumentTypeLabel(item.document_type)}
            variant="primary"
            size="sm"
          />
          <Badge
            label={getStatusLabel(item.payment_status)}
            variant={PAYMENT_VARIANT[item.payment_status] ?? 'default'}
            size="sm"
          />
        </View>

        {item.purpose && (
          <Text style={styles.purposeText} numberOfLines={2}>
            {item.purpose}
          </Text>
        )}

        {item.amount != null && (
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.infoText}>
              PHP {Number(item.amount).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.text.secondary} />
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
      </Pressable>
    ),
    [router],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={filters.search}
          onChangeText={handleSearch}
          placeholder="Search document requests..."
          searchIcon={
            <Ionicons name="search" size={18} color={colors.text.secondary} />
          }
        />
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          data={STATUS_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key ?? 'all'}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              selected={filters.status === item.key}
              onPress={() => handleStatusFilter(item.key)}
              style={{ marginRight: spacing.xs }}
            />
          )}
        />
      </View>

      {/* Document List */}
      {isLoading && documents.length === 0 ? (
        <LoadingSpinner label="Loading document requests..." />
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary[600]]}
              tintColor={colors.primary[600]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={
                <Ionicons
                  name="folder-open-outline"
                  size={48}
                  color={colors.grey[300]}
                />
              }
              title="No Document Requests"
              description={
                filters.search || filters.status
                  ? 'Try adjusting your search or filters.'
                  : 'You have not requested any documents yet.'
              }
              actionLabel="Request Document"
              onAction={() => router.push('/(app)/(documents)/new')}
            />
          }
        />
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/(app)/(documents)/new')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  filterContainer: {
    paddingBottom: spacing.xs,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl + 60,
  },
  documentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  referenceNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  purposeText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabPressed: {
    backgroundColor: colors.primary[700],
    transform: [{ scale: 0.95 }],
  },
});
