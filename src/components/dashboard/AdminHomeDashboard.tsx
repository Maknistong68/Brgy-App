import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card, LoadingSpinner } from '@/components/ui';
import { getRecentActivity, RecentActivityItem } from '@/services/dashboard';
import { GreetingHeader } from './GreetingHeader';
import { AnnouncementsList, AnnouncementItem } from './AnnouncementsList';
import { RecentActivityList } from './RecentActivityList';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';

interface AdminStats {
  myComplaints: number;
  myDocuments: number;
  pendingComplaints: number;
  pendingDocuments: number;
  assignedToMe: number;
  pendingReview: number;
  totalComplaintsThisMonth: number;
  resolvedThisMonth: number;
  totalUsers: number;
}

export function AdminHomeDashboard() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { isStaff } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    myComplaints: 0,
    myDocuments: 0,
    pendingComplaints: 0,
    pendingDocuments: 0,
    assignedToMe: 0,
    pendingReview: 0,
    totalComplaintsThisMonth: 0,
    resolvedThisMonth: 0,
    totalUsers: 0,
  });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : 'User';
  const role = profile?.role ?? 'resident';

  const fetchData = useCallback(async () => {
    try {
      if (!profile || !profile.barangay_id) return;

      const userId = profile.user_id;
      const barangayId = profile.barangay_id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch all counts in parallel
      const [
        myComplaintsRes,
        myDocumentsRes,
        pendingComplaintsRes,
        pendingDocumentsRes,
        announcementsRes,
        assignedRes,
        pendingReviewRes,
        totalMonthRes,
        resolvedMonthRes,
        usersRes,
        activityRes,
      ] = await Promise.all([
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .eq('complainant_id', userId),
        supabase
          .from('document_requests')
          .select('id', { count: 'exact', head: true })
          .eq('requestor_id', userId),
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .eq('complainant_id', userId)
          .in('status', ['submitted', 'under_review', 'in_progress']),
        supabase
          .from('document_requests')
          .select('id', { count: 'exact', head: true })
          .eq('requestor_id', userId)
          .in('status', ['submitted', 'processing', 'for_approval']),
        supabase
          .from('announcements')
          .select('id, title, content, created_at, is_pinned')
          .eq('barangay_id', barangayId)
          .eq('is_published', true)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', profile.id)
          .in('status', ['under_review', 'in_progress']),
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'submitted')
          .eq('barangay_id', barangayId),
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .eq('barangay_id', barangayId)
          .gte('created_at', startOfMonth),
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .eq('barangay_id', barangayId)
          .eq('status', 'resolved')
          .gte('resolved_at', startOfMonth),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('barangay_id', barangayId),
        getRecentActivity(barangayId, 8),
      ]);

      setStats({
        myComplaints: myComplaintsRes.count ?? 0,
        myDocuments: myDocumentsRes.count ?? 0,
        pendingComplaints: pendingComplaintsRes.count ?? 0,
        pendingDocuments: pendingDocumentsRes.count ?? 0,
        assignedToMe: assignedRes.count ?? 0,
        pendingReview: pendingReviewRes.count ?? 0,
        totalComplaintsThisMonth: totalMonthRes.count ?? 0,
        resolvedThisMonth: resolvedMonthRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
      });
      setAnnouncements((announcementsRes.data as AnnouncementItem[]) ?? []);
      setRecentActivity(activityRes.data ?? []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile, isStaff]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const resolutionRate =
    stats.totalComplaintsThisMonth > 0
      ? Math.round((stats.resolvedThisMonth / stats.totalComplaintsThisMonth) * 100)
      : 0;

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary[600]]}
          tintColor={colors.primary[600]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <GreetingHeader fullName={fullName} role={role} />

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.quickActionCard,
              pressed && styles.quickActionPressed,
            ]}
            onPress={() => router.push('/(app)/(complaints)/new')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.error.light + '20' }]}>
              <Ionicons name="megaphone-outline" size={28} color={colors.error.main} />
            </View>
            <Text style={styles.quickActionText}>File Complaint</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.quickActionCard,
              pressed && styles.quickActionPressed,
            ]}
            onPress={() => router.push('/(app)/(documents)/new')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary[50] }]}>
              <Ionicons name="document-outline" size={28} color={colors.secondary[600]} />
            </View>
            <Text style={styles.quickActionText}>Request Document</Text>
          </Pressable>
        </View>
      </View>

      {/* My Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Activity</Text>
        <View style={styles.statsGrid}>
          <Pressable
            style={styles.statCard}
            onPress={() => router.push('/(app)/(complaints)')}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.secondary[50] }]}>
              <Ionicons name="document-text-outline" size={22} color={colors.secondary[600]} />
            </View>
            <Text style={styles.statNumber}>{stats.myComplaints}</Text>
            <Text style={styles.statLabel}>My Complaints</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => router.push('/(app)/(documents)')}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.info.light + '20' }]}>
              <Ionicons name="folder-outline" size={22} color={colors.info.main} />
            </View>
            <Text style={styles.statNumber}>{stats.myDocuments}</Text>
            <Text style={styles.statLabel}>My Documents</Text>
          </Pressable>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.warning.light + '20' }]}>
              <Ionicons name="time-outline" size={22} color={colors.warning.main} />
            </View>
            <Text style={styles.statNumber}>
              {stats.pendingComplaints + stats.pendingDocuments}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Staff Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="person-outline" size={22} color={colors.primary[600]} />
            </View>
            <Text style={styles.statNumber}>{stats.assignedToMe}</Text>
            <Text style={styles.statLabel}>Assigned to Me</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="eye-outline" size={22} color={colors.warning.main} />
            </View>
            <Text style={styles.statNumber}>{stats.pendingReview}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </View>
        </View>
      </View>

      {/* Barangay Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Barangay Overview</Text>
        <Card style={styles.adminStatsCard}>
          <View style={styles.adminStatsRow}>
            <View style={styles.adminStatItem}>
              <Text style={styles.adminStatNumber}>
                {stats.totalComplaintsThisMonth}
              </Text>
              <Text style={styles.adminStatLabel}>Complaints This Month</Text>
            </View>
            <View style={styles.adminStatDivider} />
            <View style={styles.adminStatItem}>
              <Text
                style={[
                  styles.adminStatNumber,
                  { color: resolutionRate >= 70 ? colors.success.main : colors.warning.main },
                ]}
              >
                {resolutionRate}%
              </Text>
              <Text style={styles.adminStatLabel}>Resolution Rate</Text>
            </View>
            <View style={styles.adminStatDivider} />
            <View style={styles.adminStatItem}>
              <Text style={styles.adminStatNumber}>{stats.totalUsers}</Text>
              <Text style={styles.adminStatLabel}>Total Users</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Recent Activity */}
      <RecentActivityList items={recentActivity} />

      {/* Monthly Trends Placeholder */}
      <View style={styles.section}>
        <Card
          header="Monthly Complaints Trend"
        >
          <View style={styles.chartPlaceholder}>
            <Ionicons
              name="bar-chart-outline"
              size={48}
              color={colors.grey[300]}
            />
            <Text style={styles.chartPlaceholderText}>
              Chart visualization coming soon
            </Text>
          </View>
        </Card>
      </View>

      <AnnouncementsList announcements={announcements} />

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
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
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  quickActionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  adminStatsCard: {
    overflow: 'visible',
  },
  adminStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  adminStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
  },
  adminStatNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  adminStatLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  chartPlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey[50],
    borderRadius: borderRadius.md,
  },
  chartPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});
