import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
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
import SearchBar from '@/components/ui/SearchBar';
import FilterChip from '@/components/ui/FilterChip';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { getUsers, updateUserRole, verifyUser } from '@/services/admin';
import { UserRole } from '@/types';
import type { Profile } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_FILTERS: { label: string; value: UserRole | null }[] = [
  { label: 'All', value: null },
  { label: 'Resident', value: UserRole.RESIDENT },
  { label: 'Staff', value: UserRole.STAFF },
  { label: 'Secretary', value: UserRole.SECRETARY },
  { label: 'Treasurer', value: UserRole.TREASURER },
  { label: 'Captain', value: UserRole.CAPTAIN },
  { label: 'Admin', value: UserRole.SYSTEM_ADMIN },
];

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  [UserRole.RESIDENT]: 'default',
  [UserRole.STAFF]: 'info',
  [UserRole.SECRETARY]: 'secondary',
  [UserRole.TREASURER]: 'warning',
  [UserRole.CAPTAIN]: 'primary',
  [UserRole.SYSTEM_ADMIN]: 'error',
};

const AVAILABLE_ROLES: { label: string; value: UserRole }[] = [
  { label: 'Resident', value: UserRole.RESIDENT },
  { label: 'Staff', value: UserRole.STAFF },
  { label: 'Secretary', value: UserRole.SECRETARY },
  { label: 'Treasurer', value: UserRole.TREASURER },
  { label: 'Captain', value: UserRole.CAPTAIN },
  { label: 'System Admin', value: UserRole.SYSTEM_ADMIN },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UsersScreen() {
  const currentProfile = useAuthStore((s) => s.profile);
  const barangayId = currentProfile?.barangay_id ?? '';

  const [users, setUsers] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null);
  const [page, setPage] = useState(1);

  // Bottom sheet state
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole | null>(null);

  // ---------- Data Fetching ----------

  const fetchUsers = useCallback(
    async (pageNum: number = 1, isRefresh: boolean = false) => {
      if (!barangayId) return;

      try {
        const res = await getUsers(barangayId, {
          search: search || undefined,
          role: roleFilter ?? undefined,
          page: pageNum,
          pageSize: 20,
        });

        if (res.data) {
          if (pageNum === 1 || isRefresh) {
            setUsers(res.data);
          } else {
            setUsers((prev) => [...prev, ...res.data!]);
          }
          setTotalCount(res.count);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    },
    [barangayId, search, roleFilter],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchUsers(1, true);
  }, [fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchUsers(1, true);
    setRefreshing(false);
  }, [fetchUsers]);

  const onLoadMore = useCallback(() => {
    if (users.length < totalCount) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage);
    }
  }, [users.length, totalCount, page, fetchUsers]);

  // ---------- Actions ----------

  const handleUserPress = (user: Profile) => {
    setSelectedUser(user);
    setSelectedNewRole(user.role);
    setSheetVisible(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !selectedNewRole || selectedNewRole === selectedUser.role) return;

    setActionLoading(true);
    const res = await updateUserRole(
      selectedUser.id,
      selectedNewRole,
      currentProfile?.id ?? '',
      (currentProfile?.role ?? UserRole.RESIDENT) as UserRole,
    );
    setActionLoading(false);

    if (res.error) {
      Alert.alert('Error', res.error.message);
      return;
    }

    // Update local list
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, role: selectedNewRole } : u,
      ),
    );
    setSelectedUser((prev) => (prev ? { ...prev, role: selectedNewRole } : null));
    Alert.alert('Success', 'User role updated successfully.');
  };

  const handleVerifyUser = async () => {
    if (!selectedUser || !currentProfile) return;

    setActionLoading(true);
    const res = await verifyUser(selectedUser.id, currentProfile.id);
    setActionLoading(false);

    if (res.error) {
      Alert.alert('Error', res.error.message);
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, is_verified: true } : u,
      ),
    );
    setSelectedUser((prev) => (prev ? { ...prev, is_verified: true } : null));
    Alert.alert('Success', 'User verified successfully.');
  };

  // ---------- Renders ----------

  const renderUserItem = ({ item }: { item: Profile }) => {
    const fullName = `${item.first_name} ${item.last_name}`;
    return (
      <Pressable
        style={({ pressed }) => [styles.userCard, pressed && styles.userCardPressed]}
        onPress={() => handleUserPress(item)}
      >
        <Avatar name={fullName} size="md" />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={styles.userBadges}>
            <Badge
              label={item.role.replace('_', ' ')}
              variant={ROLE_BADGE_VARIANT[item.role] ?? 'default'}
              size="sm"
            />
            {item.is_verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success.main} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.unverifiedBadge}>
                <Ionicons name="alert-circle" size={14} color={colors.warning.main} />
                <Text style={styles.unverifiedText}>Unverified</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.grey[400]} />
      </Pressable>
    );
  };

  if (loading) {
    return <LoadingSpinner label="Loading users..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
          searchIcon={<Ionicons name="search" size={18} color={colors.text.secondary} />}
        />
      </View>

      {/* Role Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {ROLE_FILTERS.map((rf) => (
          <FilterChip
            key={rf.label}
            label={rf.label}
            selected={roleFilter === rf.value}
            onPress={() => setRoleFilter(rf.value)}
          />
        ))}
      </ScrollView>

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : styles.listContent}
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
            icon={<Ionicons name="people-outline" size={48} color={colors.grey[400]} />}
            title="No users found"
            description="Try adjusting your search or filter criteria."
          />
        }
        ListFooterComponent={
          users.length > 0 && users.length < totalCount ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      {/* User Actions Bottom Sheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'User Actions'}
      >
        {selectedUser && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* User Info Summary */}
            <View style={styles.sheetUserInfo}>
              <Avatar
                name={`${selectedUser.first_name} ${selectedUser.last_name}`}
                size="lg"
              />
              <View style={styles.sheetUserDetails}>
                <Text style={styles.sheetUserName}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </Text>
                <Text style={styles.sheetUserEmail}>{selectedUser.email}</Text>
                <Badge
                  label={selectedUser.role.replace('_', ' ')}
                  variant={ROLE_BADGE_VARIANT[selectedUser.role] ?? 'default'}
                  size="sm"
                  style={{ marginTop: spacing.xs }}
                />
              </View>
            </View>

            {/* Change Role */}
            <Text style={styles.sheetSectionTitle}>Change Role</Text>
            <View style={styles.roleGrid}>
              {AVAILABLE_ROLES.map((role) => (
                <Pressable
                  key={role.value}
                  style={[
                    styles.roleOption,
                    selectedNewRole === role.value && styles.roleOptionSelected,
                  ]}
                  onPress={() => setSelectedNewRole(role.value)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      selectedNewRole === role.value && styles.roleOptionTextSelected,
                    ]}
                  >
                    {role.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              title="Update Role"
              onPress={handleChangeRole}
              loading={actionLoading}
              disabled={!selectedNewRole || selectedNewRole === selectedUser.role}
              fullWidth
              style={{ marginTop: spacing.sm }}
            />

            {/* Verify User */}
            {!selectedUser.is_verified && (
              <View style={styles.verifySection}>
                <Text style={styles.sheetSectionTitle}>Verification</Text>
                <Button
                  title="Verify User"
                  onPress={handleVerifyUser}
                  variant="outline"
                  loading={actionLoading}
                  fullWidth
                  leftIcon={
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={colors.primary[600]}
                    />
                  }
                />
              </View>
            )}

            {selectedUser.is_verified && (
              <View style={styles.verifySection}>
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
                  <Text style={styles.verifiedLabel}>This user is verified</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </BottomSheet>
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  chipRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  userCardPressed: {
    opacity: 0.85,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  userBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    color: colors.success.main,
    fontWeight: fontWeight.medium,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  unverifiedText: {
    fontSize: fontSize.xs,
    color: colors.warning.main,
    fontWeight: fontWeight.medium,
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

  // Bottom Sheet
  sheetUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetUserDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sheetUserName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  sheetUserEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sheetSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  roleOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  roleOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  roleOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  roleOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  verifySection: {
    marginTop: spacing.lg,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  verifiedLabel: {
    fontSize: fontSize.md,
    color: colors.success.main,
    fontWeight: fontWeight.medium,
  },
});
