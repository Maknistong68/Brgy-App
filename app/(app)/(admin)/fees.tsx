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
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { getFeeSchedule } from '@/services/document';
import { updateFeeSchedule } from '@/services/admin';
import { DOCUMENT_TYPE_LABELS } from '@/constants';
import type { DocumentFeeSchedule } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPHP(amount: number): string {
  return `PHP ${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeesScreen() {
  const profile = useAuthStore((s) => s.profile);
  const barangayId = profile?.barangay_id ?? '';

  const [fees, setFees] = useState<DocumentFeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingFee, setEditingFee] = useState<DocumentFeeSchedule | null>(null);
  const [formFee, setFormFee] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // ---------- Data Fetching ----------

  const fetchFees = useCallback(async () => {
    if (!barangayId) return;

    try {
      const res = await getFeeSchedule(barangayId);
      if (res.data) {
        setFees(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch fees:', error);
    } finally {
      setLoading(false);
    }
  }, [barangayId]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFees();
    setRefreshing(false);
  }, [fetchFees]);

  // ---------- Edit Handlers ----------

  const openEditSheet = (fee: DocumentFeeSchedule) => {
    setEditingFee(fee);
    setFormFee(fee.fee.toString());
    setFormDescription(fee.description ?? '');
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setEditingFee(null);
    setFormFee('');
    setFormDescription('');
  };

  const handleSave = async () => {
    if (!editingFee) return;

    const numericFee = parseFloat(formFee);
    if (isNaN(numericFee) || numericFee < 0) {
      Alert.alert('Validation', 'Please enter a valid fee amount.');
      return;
    }

    setSaving(true);

    try {
      const res = await updateFeeSchedule(
        editingFee.id,
        numericFee,
        formDescription.trim() || undefined,
      );

      if (res.error) {
        Alert.alert('Error', res.error.message);
        return;
      }

      // Update local state
      setFees((prev) =>
        prev.map((f) =>
          f.id === editingFee.id
            ? {
                ...f,
                fee: numericFee,
                description: formDescription.trim() || f.description,
              }
            : f,
        ),
      );

      closeSheet();
      Alert.alert('Success', 'Fee updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Renders ----------

  const renderFeeItem = ({ item }: { item: DocumentFeeSchedule }) => {
    const label =
      DOCUMENT_TYPE_LABELS[item.document_type] ?? item.document_type;

    return (
      <View style={styles.feeRow}>
        <View style={styles.feeInfo}>
          <View style={styles.feeIconWrap}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.primary[600]}
            />
          </View>
          <View style={styles.feeTextWrap}>
            <Text style={styles.feeLabel} numberOfLines={1}>
              {label}
            </Text>
            {item.description ? (
              <Text style={styles.feeDescription} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.feeRight}>
          <Text style={styles.feeAmount}>{formatPHP(item.fee)}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
            onPress={() => openEditSheet(item)}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary[600]} />
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner label="Loading fee schedule..." />;
  }

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name="cash-outline" size={24} color={colors.primary[600]} />
        </View>
        <View>
          <Text style={styles.summaryTitle}>Document Fee Schedule</Text>
          <Text style={styles.summarySubtitle}>
            {fees.length} document type{fees.length !== 1 ? 's' : ''} configured
          </Text>
        </View>
      </View>

      {/* Fee List */}
      <FlatList
        data={fees}
        keyExtractor={(item) => item.id}
        renderItem={renderFeeItem}
        contentContainerStyle={
          fees.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="cash-outline" size={48} color={colors.grey[400]} />}
            title="No fees configured"
            description="Fee schedule entries will appear here once configured in the database."
          />
        }
      />

      {/* Edit Bottom Sheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={closeSheet}
        title={
          editingFee
            ? `Edit: ${DOCUMENT_TYPE_LABELS[editingFee.document_type] ?? editingFee.document_type}`
            : 'Edit Fee'
        }
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Input
            label="Fee Amount (PHP)"
            value={formFee}
            onChangeText={setFormFee}
            placeholder="e.g. 50.00"
            keyboardType="decimal-pad"
            leftIcon={
              <Text style={styles.currencyIcon}>PHP</Text>
            }
          />

          <Input
            label="Description (optional)"
            value={formDescription}
            onChangeText={setFormDescription}
            placeholder="e.g. Standard processing fee"
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 80, textAlignVertical: 'top' as any }}
          />

          <Button
            title="Save Fee"
            onPress={handleSave}
            loading={saving}
            fullWidth
            style={{ marginTop: spacing.sm }}
            leftIcon={
              <Ionicons name="checkmark" size={18} color={colors.white} />
            }
          />

          <Button
            title="Cancel"
            onPress={closeSheet}
            variant="ghost"
            fullWidth
            style={{ marginTop: spacing.xs }}
          />
        </ScrollView>
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
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  summarySubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Fee Row
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  feeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  feeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  feeTextWrap: {
    flex: 1,
  },
  feeLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  feeDescription: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  feeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  feeAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  editButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  editButtonPressed: {
    backgroundColor: colors.grey[100],
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },

  // Currency icon
  currencyIcon: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
  },
});
