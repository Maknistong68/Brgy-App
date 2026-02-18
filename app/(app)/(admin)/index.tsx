import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
} from '@/theme';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { getSystemStats } from '@/services/admin';
import {
  getComplaintStats,
  getDocumentStats,
} from '@/services/dashboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickStat {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface AdminCard {
  key: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN_CARDS: AdminCard[] = [
  {
    key: 'users',
    route: '/(app)/(admin)/users',
    icon: 'people',
    title: 'User Management',
    description: 'Manage residents, staff, and roles',
    color: colors.secondary[500],
  },
  {
    key: 'reports',
    route: '/(app)/(admin)/reports',
    icon: 'bar-chart',
    title: 'Reports',
    description: 'View complaint and document statistics',
    color: colors.info.main,
  },
  {
    key: 'announcements',
    route: '/(app)/(admin)/announcements',
    icon: 'megaphone',
    title: 'Announcements',
    description: 'Create and manage announcements',
    color: colors.warning.main,
  },
  {
    key: 'fees',
    route: '/(app)/(admin)/fees',
    icon: 'cash',
    title: 'Fee Schedule',
    description: 'Manage document processing fees',
    color: colors.success.main,
  },
  {
    key: 'settings',
    route: '/(app)/(admin)/settings',
    icon: 'settings',
    title: 'Barangay Settings',
    description: 'Update barangay information',
    color: colors.primary[600],
  },
  {
    key: 'audit-logs',
    route: '/(app)/(admin)/audit-logs',
    icon: 'list',
    title: 'Audit Logs',
    description: 'Track all system activities',
    color: colors.grey[700],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const barangayId = profile?.barangay_id ?? '';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);

  const fetchStats = useCallback(async () => {
    if (!barangayId) return;

    try {
      const [systemRes, complaintsRes, documentsRes] = await Promise.all([
        getSystemStats(),
        getComplaintStats(barangayId),
        getDocumentStats(barangayId),
      ]);

      const totalUsers = systemRes.data?.totalUsers ?? 0;

      const pendingComplaints =
        (complaintsRes.data?.byStatus?.submitted ?? 0) +
        (complaintsRes.data?.byStatus?.under_review ?? 0) +
        (complaintsRes.data?.byStatus?.in_progress ?? 0);

      const pendingDocuments =
        (documentsRes.data?.byStatus?.submitted ?? 0) +
        (documentsRes.data?.byStatus?.processing ?? 0) +
        (documentsRes.data?.byStatus?.for_approval ?? 0);

      setQuickStats([
        {
          label: 'Total Users',
          value: totalUsers,
          icon: 'people-outline',
          color: colors.secondary[500],
        },
        {
          label: 'Pending Complaints',
          value: pendingComplaints,
          icon: 'alert-circle-outline',
          color: colors.warning.main,
        },
        {
          label: 'Pending Documents',
          value: pendingDocuments,
          icon: 'document-text-outline',
          color: colors.info.main,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  }, [barangayId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary[600]]}
          tintColor={colors.primary[600]}
        />
      }
    >
      {/* Quick Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      ) : (
        <View style={styles.statsRow}>
          {quickStats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + '18' }]}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Admin Cards Grid */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Administration
      </Text>

      <View style={styles.grid}>
        {ADMIN_CARDS.map((card) => (
          <Pressable
            key={card.key}
            style={({ pressed }) => [
              styles.gridCard,
              pressed && styles.gridCardPressed,
            ]}
            onPress={() => router.push(card.route as any)}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: card.color + '18' }]}>
              <Ionicons name={card.icon} size={28} color={card.color} />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {card.description}
            </Text>
            <View style={styles.cardArrow}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.text.secondary}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Quick Stats
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCard: {
    width: '48.5%' as any,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 150,
    ...shadows.md,
  },
  gridCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 16,
    flex: 1,
  },
  cardArrow: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
});
