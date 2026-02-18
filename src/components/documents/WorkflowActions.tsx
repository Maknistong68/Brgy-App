import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { usePermissions } from '@/hooks/usePermissions';
import { DOCUMENT_STATUS_TRANSITIONS } from '@/constants';
import { colors, spacing } from '@/theme';

type DocumentStatus =
  | 'submitted'
  | 'processing'
  | 'for_approval'
  | 'approved'
  | 'for_release'
  | 'released'
  | 'rejected';

interface WorkflowActionsProps {
  currentStatus: string;
  paymentStatus: string;
  onTransition: (newStatus: string) => void;
  onMarkPaid?: () => void;
  loading?: boolean;
}

interface ActionConfig {
  status: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'outline' | 'danger';
}

function getAvailableActions(currentStatus: string, paymentStatus: string): ActionConfig[] {
  const transitions = DOCUMENT_STATUS_TRANSITIONS[currentStatus] ?? [];
  const actions: ActionConfig[] = [];

  for (const nextStatus of transitions) {
    switch (nextStatus) {
      case 'processing':
        actions.push({ status: 'processing', label: 'Process', icon: 'cog-outline', variant: 'primary' });
        break;
      case 'for_approval':
        actions.push({ status: 'for_approval', label: 'Submit for Approval', icon: 'arrow-up-circle-outline', variant: 'primary' });
        break;
      case 'approved':
        actions.push({ status: 'approved', label: 'Approve', icon: 'checkmark-circle-outline', variant: 'primary' });
        break;
      case 'for_release':
        actions.push({ status: 'for_release', label: 'Ready for Release', icon: 'clipboard-outline', variant: 'secondary' });
        break;
      case 'released':
        actions.push({ status: 'released', label: 'Release', icon: 'paper-plane-outline', variant: 'primary' });
        break;
      case 'rejected':
        actions.push({ status: 'rejected', label: 'Reject', icon: 'close-circle-outline', variant: 'danger' });
        break;
    }
  }

  return actions;
}

export function WorkflowActions({
  currentStatus,
  paymentStatus,
  onTransition,
  onMarkPaid,
  loading = false,
}: WorkflowActionsProps) {
  const { hasPermission, isRoleAtLeast } = usePermissions();
  const actions = getAvailableActions(currentStatus, paymentStatus);

  // Filter actions based on permissions
  const filteredActions = actions.filter((action) => {
    switch (action.status) {
      case 'processing':
        return hasPermission('documents', 'update');
      case 'for_approval':
        return hasPermission('documents', 'update');
      case 'approved':
        return hasPermission('documents', 'approve');
      case 'for_release':
        return hasPermission('documents', 'update');
      case 'released':
        return hasPermission('documents', 'update');
      case 'rejected':
        return hasPermission('documents', 'update');
      default:
        return false;
    }
  });

  // Show "Mark as Paid" if payment is pending and user has permission
  const showPaymentAction =
    paymentStatus === 'pending' &&
    currentStatus !== 'rejected' &&
    currentStatus !== 'released' &&
    onMarkPaid &&
    isRoleAtLeast('staff');

  if (filteredActions.length === 0 && !showPaymentAction) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showPaymentAction && (
        <Button
          title="Mark as Paid"
          variant="outline"
          size="sm"
          onPress={onMarkPaid}
          loading={loading}
          leftIcon={
            <Ionicons name="cash-outline" size={18} color={colors.primary[600]} />
          }
          style={styles.actionButton}
        />
      )}

      {filteredActions.map((action) => (
        <Button
          key={action.status}
          title={action.label}
          variant={action.variant}
          size="sm"
          onPress={() => onTransition(action.status)}
          loading={loading}
          leftIcon={
            <Ionicons
              name={action.icon as any}
              size={18}
              color={action.variant === 'outline' ? colors.primary[600] : colors.white}
            />
          }
          style={styles.actionButton}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    flex: 0,
  },
});
