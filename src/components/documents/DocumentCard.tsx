import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';
import StatusBadge from '@/components/ui/StatusBadge';
import Badge from '@/components/ui/Badge';
import { DOCUMENT_TYPE_LABELS } from '@/constants';
import { formatDistanceToNow } from 'date-fns';

interface DocumentCardProps {
  document: {
    id: string;
    reference_number: string;
    document_type: string;
    status: string;
    payment_status: string;
    amount?: number | null;
    purpose: string;
    created_at: string;
  };
  onPress: (id: string) => void;
}

function getPaymentBadgeProps(paymentStatus: string): { variant: 'success' | 'warning' | 'info'; label: string } {
  switch (paymentStatus) {
    case 'paid':
      return { variant: 'success', label: 'Paid' };
    case 'waived':
      return { variant: 'info', label: 'Waived' };
    case 'pending':
    default:
      return { variant: 'warning', label: 'Unpaid' };
  }
}

export function DocumentCard({ document, onPress }: DocumentCardProps) {
  const paymentBadge = getPaymentBadgeProps(document.payment_status);
  const typeLabel = DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type;

  return (
    <Pressable style={styles.card} onPress={() => onPress(document.id)}>
      <View style={styles.header}>
        <Text style={styles.refNumber}>{document.reference_number}</Text>
        <Badge
          label={paymentBadge.label}
          variant={paymentBadge.variant}
          size="sm"
        />
      </View>

      <View style={styles.typeRow}>
        <Ionicons name="document-text-outline" size={18} color={colors.primary[600]} />
        <Text style={styles.typeLabel}>{typeLabel}</Text>
      </View>

      <Text style={styles.purpose} numberOfLines={2}>
        {document.purpose}
      </Text>

      <View style={styles.footer}>
        <StatusBadge status={document.status} />
        <Text style={styles.date}>
          {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  refNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  purpose: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.grey[500],
  },
});
