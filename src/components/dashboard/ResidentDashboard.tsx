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
import { LoadingSpinner } from '@/components/ui';
import { GreetingHeader } from './GreetingHeader';
import { AnnouncementsList, AnnouncementItem } from './AnnouncementsList';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';

interface ResidentStats {
  myComplaints: number;
  myDocuments: number;
  pendingComplaints: number;
  pendingDocuments: number;
  assignedToMe: number;
  pendingReview: number;
}

export function ResidentDashboard() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { isStaff } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ResidentStats>({
    myComplaints: 0,
    myDocuments: 0,
    pendingComplaints: 0,
    pendingDocuments: 0,
    assignedToMe: 0,
    pendingReview: 0,
  });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : 'User';
  const role = profile?.role ?? 'resident';

  const fetchData = useCallback(async () => {
    try {
      if (!profile || !profile.barangay_id) return;

      const userId = profile.user_id;
      const barangayId = profile.barangay_id;

      const [
        myComplaintsRes,
        myDocumentsRes,
        pendingComplaintsRes,
        pendingDocumentsRes,
        announcementsRes,
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
      ]);

      const newStats: ResidentStats = {
        myComplaints: myComplaintsRes.count ?? 0,
        myDocuments: myDocumentsRes.count ?? 0,
        pendingComplaints: pendingComplaintsRes.count ?? 0,
        pendingDocuments: pendingDocumentsRes.count ?? 0,
        assignedToMe: 0,
        pendingReview: 0,
      };

      // Staff stats
      if (isStaff) {
        const [assignedRes, pendingReviewRes] = await Promise.all([
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
        ]);
        newStats.assignedToMe = assignedRes.count ?? 0;
        newStats.pendingReview = pendingReviewRes.count ?? 0;
      }

      setStats(newStats);
      setAnnouncements((announcementsRes.data as AnnouncementItem[]) ?? []);
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
      {isStaff && (
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
      )}

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
});
