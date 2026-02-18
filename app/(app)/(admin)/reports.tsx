import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
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
import Card from '@/components/ui/Card';
import FilterChip from '@/components/ui/FilterChip';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import {
  getComplaintStats,
  getDocumentStats,
  getResolutionMetrics,
  getMonthlyTrends,
} from '@/services/dashboard';
import type {
  ComplaintStats,
  DocumentStats,
  ResolutionMetrics,
  MonthlyTrendItem,
  DateRange,
} from '@/services/dashboard';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type DateRangePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

interface DatePreset {
  label: string;
  value: DateRangePreset;
}

const DATE_PRESETS: DatePreset[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'This Year', value: 'this_year' },
];

function getDateRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;

  switch (preset) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'this_week': {
      const day = now.getDay();
      from = new Date(now);
      from.setDate(now.getDate() - day);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'this_quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    }
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { from: from.toISOString(), to };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const barangayId = profile?.barangay_id ?? '';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('this_month');

  const [complaintStats, setComplaintStats] = useState<ComplaintStats | null>(null);
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(null);
  const [resolution, setResolution] = useState<ResolutionMetrics | null>(null);
  const [trends, setTrends] = useState<MonthlyTrendItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!barangayId) return;

    const dateRange = getDateRange(selectedPreset);

    try {
      const [cRes, dRes, rRes, tRes] = await Promise.all([
        getComplaintStats(barangayId, dateRange),
        getDocumentStats(barangayId, dateRange),
        getResolutionMetrics(barangayId, dateRange),
        getMonthlyTrends(barangayId, 6),
      ]);

      if (cRes.data) setComplaintStats(cRes.data);
      if (dRes.data) setDocumentStats(dRes.data);
      if (rRes.data) setResolution(rRes.data);
      if (tRes.data) setTrends(tRes.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  }, [barangayId, selectedPreset]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleExport = () => {
    Alert.alert('Export', 'Export CSV feature coming soon.');
  };

  // ---------- Helpers ----------

  const maxTrendValue = Math.max(
    ...trends.map((t) => Math.max(t.complaints, t.documents)),
    1,
  );

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'short' });
  };

  if (loading) {
    return <LoadingSpinner label="Loading reports..." />;
  }

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
      {/* Date Range Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {DATE_PRESETS.map((preset) => (
          <FilterChip
            key={preset.value}
            label={preset.label}
            selected={selectedPreset === preset.value}
            onPress={() => setSelectedPreset(preset.value)}
          />
        ))}
      </ScrollView>

      {/* Complaint Stats */}
      <Text style={styles.sectionTitle}>Complaint Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: colors.secondary[500] }]}>
          <Text style={styles.statValue}>{complaintStats?.total ?? 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.success.main }]}>
          <Text style={styles.statValue}>
            {complaintStats?.byStatus?.resolved ?? 0}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.warning.main }]}>
          <Text style={styles.statValue}>
            {(complaintStats?.byStatus?.submitted ?? 0) +
              (complaintStats?.byStatus?.under_review ?? 0) +
              (complaintStats?.byStatus?.in_progress ?? 0)}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.info.main }]}>
          <Text style={styles.statValue}>
            {resolution?.avgResolutionDays !== null
              ? `${resolution?.avgResolutionDays}d`
              : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Avg. Resolution</Text>
        </View>
      </View>

      {/* Document Stats */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Document Requests
      </Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: colors.secondary[500] }]}>
          <Text style={styles.statValue}>{documentStats?.total ?? 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.success.main }]}>
          <Text style={styles.statValue}>
            {documentStats?.byStatus?.released ?? 0}
          </Text>
          <Text style={styles.statLabel}>Released</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.warning.main }]}>
          <Text style={styles.statValue}>
            {(documentStats?.byStatus?.submitted ?? 0) +
              (documentStats?.byStatus?.processing ?? 0) +
              (documentStats?.byStatus?.for_approval ?? 0)}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.error.main }]}>
          <Text style={styles.statValue}>
            {documentStats?.byStatus?.rejected ?? 0}
          </Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Monthly Trends */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Monthly Trends (Last 6 Months)
      </Text>
      <Card style={styles.chartCard}>
        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary[500] }]} />
            <Text style={styles.legendText}>Complaints</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary[400] }]} />
            <Text style={styles.legendText}>Documents</Text>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          {trends.map((item) => (
            <View key={item.month} style={styles.chartColumn}>
              <View style={styles.barGroup}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(
                        (item.complaints / maxTrendValue) * 120,
                        4,
                      ),
                      backgroundColor: colors.primary[500],
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(
                        (item.documents / maxTrendValue) * 120,
                        4,
                      ),
                      backgroundColor: colors.secondary[400],
                    },
                  ]}
                />
              </View>
              <Text style={styles.chartLabel}>{formatMonth(item.month)}</Text>
              <Text style={styles.chartValue}>
                {item.complaints}/{item.documents}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Export */}
      <Button
        title="Export CSV"
        onPress={handleExport}
        variant="outline"
        fullWidth
        style={{ marginTop: spacing.lg }}
        leftIcon={
          <Ionicons
            name="download-outline"
            size={18}
            color={colors.primary[600]}
          />
        }
      />
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
  chipRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '46%' as any,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
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
  },

  // Chart
  chartCard: {
    marginTop: spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minHeight: 160,
    paddingTop: spacing.sm,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: spacing.xs,
  },
  bar: {
    width: 14,
    borderRadius: 3,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  chartValue: {
    fontSize: 9,
    color: colors.text.disabled,
    marginTop: 1,
  },
});
