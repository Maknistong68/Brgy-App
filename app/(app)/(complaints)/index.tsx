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
import { useComplaintStore } from '@/stores/complaintStore';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import {
  Card,
  SearchBar,
  FilterChip,
  StatusBadge,
  PriorityBadge,
  Badge,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatDate, truncateText, getCategoryLabel } from '@/utils/format';

const STATUS_FILTERS = [
  { key: null, label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function ComplaintsListScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { isStaff } = usePermissions();
  const {
    complaints,
    filters,
    isLoading,
    setComplaints,
    setFilters,
    setLoading,
    setError,
  } = useComplaintStore();
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      // Non-staff users only see their own complaints
      if (!isStaff) {
        query = query.eq('complainant_id', profile.user_id);
      } else {
        query = query.eq('barangay_id', profile.barangay_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(
          `reference_number.ilike.%${filters.search}%,respondent_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query.limit(50);
      if (error) {
        setError(error.message);
        return;
      }
      setComplaints(data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, filters, isStaff]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  }, [fetchComplaints]);

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

  const renderComplaintItem = useCallback(
    ({ item }: { item: any }) => (
      <Pressable
        style={({ pressed }) => [
          styles.complaintCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push(`/(app)/(complaints)/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.referenceNumber}>{item.reference_number}</Text>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.badgeRow}>
          <Badge
            label={getCategoryLabel(item.category)}
            variant="info"
            size="sm"
          />
          <PriorityBadge priority={item.priority} size="sm" />
        </View>

        {item.respondent_name && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.infoText}>vs. {item.respondent_name}</Text>
          </View>
        )}

        <Text style={styles.descriptionText} numberOfLines={2}>
          {truncateText(item.description, 120)}
        </Text>

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
          placeholder="Search complaints..."
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

      {/* Complaint List */}
      {isLoading && complaints.length === 0 ? (
        <LoadingSpinner label="Loading complaints..." />
      ) : (
        <FlatList
          data={complaints}
          renderItem={renderComplaintItem}
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
                  name="document-text-outline"
                  size={48}
                  color={colors.grey[300]}
                />
              }
              title="No Complaints Found"
              description={
                filters.search || filters.status
                  ? 'Try adjusting your search or filters.'
                  : 'You have not filed any complaints yet.'
              }
              actionLabel="File a Complaint"
              onAction={() => router.push('/(app)/(complaints)/new')}
            />
          }
        />
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/(app)/(complaints)/new')}
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
  complaintCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
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
