import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PermissionGateProps {
  /** The module to check permissions against (e.g. 'complaints', 'documents'). */
  module: string;
  /** The action to check (maps to can_create, can_read, etc. in role_permissions). */
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'assign' | 'export';
  /** Optional minimum role required in addition to the module/action permission. */
  minimumRole?: string;
  /** Optional fallback UI to render when the user lacks the required permission. */
  fallback?: React.ReactNode;
  /** Content to render when the user has the required permission. */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Conditionally renders its children based on the current user's role
 * permissions.
 *
 * While permissions are still loading, nothing is rendered (prevents flicker).
 * Once loaded, if the user lacks the required permission the optional
 * `fallback` is rendered instead (defaults to `null`).
 *
 * Supports an optional `minimumRole` prop that additionally checks whether the
 * user's role meets or exceeds the given role in the hierarchy.
 *
 * Usage:
 * ```tsx
 * <PermissionGate module="complaints" action="approve">
 *   <ApproveButton />
 * </PermissionGate>
 *
 * <PermissionGate module="documents" action="delete" fallback={<Text>Not allowed</Text>}>
 *   <DeleteButton />
 * </PermissionGate>
 *
 * <PermissionGate module="admin" action="read" minimumRole="secretary">
 *   <AdminPanel />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  module,
  action,
  minimumRole,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, isRoleAtLeast, isLoaded } = usePermissions();

  // Still loading role permissions -- render nothing to avoid flash.
  if (!isLoaded) return null;

  // Minimum role check (if provided).
  if (minimumRole && !isRoleAtLeast(minimumRole)) {
    return <>{fallback}</>;
  }

  // Module + action permission check.
  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  // Permission granted -- render children.
  return <>{children}</>;
}
