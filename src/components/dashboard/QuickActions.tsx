import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { usePermissions } from '@/hooks/usePermissions';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  route: string;
  module: string;
  action: 'create' | 'read';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'file_complaint',
    label: 'File Complaint',
    icon: 'megaphone-outline',
    color: colors.error.main,
    backgroundColor: '#FFEBEE',
    route: '/complaints/new',
    module: 'complaints',
    action: 'create',
  },
  {
    id: 'request_document',
    label: 'Request Document',
    icon: 'document-text-outline',
    color: colors.secondary[700],
    backgroundColor: colors.secondary[50],
    route: '/documents/new',
    module: 'documents',
    action: 'create',
  },
  {
    id: 'my_complaints',
    label: 'My Complaints',
    icon: 'list-outline',
    color: colors.warning.dark,
    backgroundColor: '#FFF3E0',
    route: '/complaints',
    module: 'complaints',
    action: 'read',
  },
  {
    id: 'my_documents',
    label: 'My Documents',
    icon: 'folder-open-outline',
    color: colors.success.dark,
    backgroundColor: '#E8F5E9',
    route: '/documents',
    module: 'documents',
    action: 'read',
  },
];

interface QuickActionsProps {
  style?: ViewStyle;
}

export function QuickActions({ style }: QuickActionsProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const visibleActions = QUICK_ACTIONS.filter((action) =>
    hasPermission(action.module, action.action),
  );

  if (visibleActions.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        {visibleActions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: action.backgroundColor },
              pressed && styles.actionCardPressed,
            ]}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${action.color}1A` }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={[styles.actionLabel, { color: action.color }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionCard: {
    width: '47%',
    flexGrow: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    ...shadows.sm,
  },
  actionCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
});
