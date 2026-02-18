import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentStore } from '@/stores/documentStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import {
  Card,
  Button,
  Badge,
  StatusBadge,
  LoadingSpinner,
  Divider,
  BottomSheet,
} from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import {
  formatDateTime,
  formatCurrency,
  getDocumentTypeLabel,
  getStatusLabel,
} from '@/utils/format';
import { getNextDocumentStatuses } from '@/utils/status';
import type { DocumentRequestWithRelations } from '@/types';

const PAYMENT_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  paid: 'success',
  pending: 'warning',
  waived: 'default',
};

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { updateDocument } = useDocumentStore();
  const { isRoleAtLeast, role } = usePermissions();
  const { showToast } = useUIStore();

  const isStaff = isRoleAtLeast('staff');
  const isTreasurer = role === 'treasurer';
  const isSecretary = isRoleAtLeast('secretary');

  const [document, setDocument] = useState<DocumentRequestWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select('*, requestor:profiles!requestor_id(*), processor:profiles!processed_by(*), approver:profiles!approved_by(*)')
        .eq('id', id)
        .single();

      if (data) {
        setDocument(data as any);
      }
    } catch (err) {
      console.error('Failed to fetch document:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocument();
    setRefreshing(false);
  }, [fetchDocument]);

  const handleStatusChange = async (newStatus: string) => {
    if (!document || !profile) return;

    setChangingStatus(true);
    try {
      const updates: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'processing') {
        updates.processed_by = profile.id;
      }
      if (newStatus === 'approved') {
        updates.approved_by = profile.id;
      }
      if (newStatus === 'released') {
        updates.released_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('document_requests')
        .update(updates)
        .eq('id', document.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Log status change
      await supabase.from('document_request_status_history').insert({
        document_request_id: document.id,
        previous_status: document.status,
        new_status: newStatus,
        changed_by: profile.id,
      });

      setDocument((prev) => (prev ? { ...prev, ...updates } : null));
      updateDocument(document.id, updates);
      setStatusSheetVisible(false);
      showToast(`Status changed to ${getStatusLabel(newStatus)}`, 'success');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!document || !profile) return;

    Alert.prompt
      ? Alert.prompt(
          'Mark as Paid',
          'Enter the Official Receipt (OR) number:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              onPress: async (orNumber?: string) => {
                const { error } = await supabase
                  .from('document_requests')
                  .update({
                    payment_status: 'paid',
                    or_number: orNumber ?? '',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', document.id);

                if (!error) {
                  setDocument((prev) =>
                    prev
                      ? { ...prev, payment_status: 'paid' as any, or_number: orNumber ?? '' }
                      : null,
                  );
                  showToast('Payment marked as paid', 'success');
                }
              },
            },
          ],
          'plain-text',
        )
      : Alert.alert('Mark as Paid', 'Confirm payment has been received?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              const { error } = await supabase
                .from('document_requests')
                .update({
                  payment_status: 'paid',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', document.id);

              if (!error) {
                setDocument((prev) =>
                  prev
                    ? { ...prev, payment_status: 'paid' as any }
                    : null,
                );
                showToast('Payment marked as paid', 'success');
              }
            },
          },
        ]);
  };

  if (loading) {
    return <LoadingSpinner label="Loading document request..." />;
  }

  if (!document) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.grey[400]} />
        <Text style={styles.notFoundText}>Document request not found</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const nextStatuses = getNextDocumentStatuses(document.status);
  const requestor = document.requestor;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
          />
        }
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.referenceNumber}>{document.reference_number}</Text>
            <StatusBadge status={document.status} />
          </View>
          <View style={styles.badgeRow}>
            <Badge
              label={getDocumentTypeLabel(document.document_type)}
              variant="primary"
            />
            <Badge
              label={getStatusLabel(document.payment_status)}
              variant={PAYMENT_VARIANT[document.payment_status] ?? 'default'}
              size="sm"
            />
          </View>
        </Card>

        {/* Requestor Info */}
        <Card header="Requestor" style={styles.infoCard}>
          {requestor ? (
            <>
              <InfoRow
                icon="person-outline"
                label="Name"
                value={`${requestor.first_name} ${requestor.last_name}`}
              />
              {requestor.phone && (
                <InfoRow icon="call-outline" label="Phone" value={requestor.phone} />
              )}
              {requestor.address && (
                <InfoRow icon="location-outline" label="Address" value={requestor.address} />
              )}
            </>
          ) : (
            <Text style={styles.mutedText}>Information unavailable</Text>
          )}
        </Card>

        {/* Request Details */}
        <Card header="Request Details" style={styles.infoCard}>
          <InfoRow
            icon="calendar-outline"
            label="Requested"
            value={formatDateTime(document.created_at)}
          />
          <InfoRow
            icon="refresh-outline"
            label="Updated"
            value={formatDateTime(document.updated_at)}
          />
          {document.amount != null && (
            <InfoRow
              icon="cash-outline"
              label="Fee"
              value={formatCurrency(document.amount)}
            />
          )}
          {document.or_number && (
            <InfoRow
              icon="receipt-outline"
              label="OR Number"
              value={document.or_number}
            />
          )}
          {document.released_at && (
            <InfoRow
              icon="checkmark-circle-outline"
              label="Released"
              value={formatDateTime(document.released_at)}
            />
          )}
          <Divider />
          <Text style={styles.descriptionHeader}>Purpose</Text>
          <Text style={styles.descriptionBody}>{document.purpose}</Text>

          {document.rejection_reason && (
            <>
              <Divider />
              <Text style={[styles.descriptionHeader, { color: colors.error.main }]}>
                Rejection Reason
              </Text>
              <Text style={styles.descriptionBody}>{document.rejection_reason}</Text>
            </>
          )}
        </Card>

        {/* Form Data */}
        {document.form_data && Object.keys(document.form_data).length > 0 && (
          <Card header="Form Information" style={styles.infoCard}>
            {Object.entries(document.form_data).map(([key, value]) => (
              <InfoRow
                key={key}
                icon="document-text-outline"
                label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                value={String(value) || 'N/A'}
              />
            ))}
          </Card>
        )}

        {/* Staff/Admin Actions */}
        {isStaff && nextStatuses.length > 0 && (
          <Card header="Workflow Actions" style={styles.infoCard}>
            <View style={styles.actionsRow}>
              <Button
                title="Change Status"
                onPress={() => setStatusSheetVisible(true)}
                variant="primary"
                size="sm"
                leftIcon={<Ionicons name="swap-horizontal-outline" size={16} color={colors.white} />}
              />
              {(isTreasurer || isSecretary) &&
                document.payment_status === 'pending' &&
                document.amount != null &&
                document.amount > 0 && (
                  <Button
                    title="Mark Paid"
                    onPress={handleMarkPaid}
                    variant="outline"
                    size="sm"
                    leftIcon={<Ionicons name="cash-outline" size={16} color={colors.primary[600]} />}
                  />
                )}
            </View>
          </Card>
        )}

        {/* Quick Links */}
        <View style={styles.linksRow}>
          <Pressable
            style={styles.linkButton}
            onPress={() => router.push(`/(app)/(documents)/${id}/history` as any)}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary[600]} />
            <Text style={styles.linkText}>View History</Text>
          </Pressable>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Status Change Sheet */}
      <BottomSheet
        visible={statusSheetVisible}
        onClose={() => setStatusSheetVisible(false)}
        title="Change Status"
      >
        {nextStatuses.map((status) => (
          <Pressable
            key={status}
            style={styles.statusOption}
            onPress={() => handleStatusChange(status)}
            disabled={changingStatus}
          >
            <StatusBadge status={status} />
            <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={infoRowStyles.row}>
      <Ionicons name={icon as any} size={16} color={colors.text.secondary} />
      <Text style={infoRowStyles.label}>{label}:</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    minWidth: 70,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  notFoundText: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
  },
  headerCard: {
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  referenceNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  infoCard: {
    marginBottom: spacing.sm,
  },
  mutedText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  descriptionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  descriptionBody: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  linksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    ...shadows.sm,
  },
  linkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
