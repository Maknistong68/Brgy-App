import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import { COMPLAINT_CATEGORY_LABELS } from '@/constants';
import { formatDistanceToNow } from 'date-fns';

interface ComplaintCardProps {
  complaint: {
    id: string;
    reference_number: string;
    category: string;
    status: string;
    priority: string;
    respondent_name: string;
    description: string;
    created_at: string;
  };
  onPress: (id: string) => void;
}

export function ComplaintCard({ complaint, onPress }: ComplaintCardProps) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(complaint.id)}>
      <View style={styles.header}>
        <Text style={styles.refNumber}>{complaint.reference_number}</Text>
        <PriorityBadge priority={complaint.priority} />
      </View>
      <Text style={styles.category}>
        {COMPLAINT_CATEGORY_LABELS[complaint.category] || complaint.category}
      </Text>
      <Text style={styles.respondent}>vs. {complaint.respondent_name}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {complaint.description}
      </Text>
      <View style={styles.footer}>
        <StatusBadge status={complaint.status} />
        <Text style={styles.date}>
          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
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
  category: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  respondent: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  description: {
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
