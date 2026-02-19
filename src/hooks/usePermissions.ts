import { useAuthStore } from '@/stores/authStore';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isRoleAtLeast as checkRoleAtLeast, hasPermission as checkPermission } from '@/utils/permissions';
import type { Module, Action } from '@/utils/permissions';
import { ROLE_HIERARCHY } from '@/constants';
import { UserRole } from '@/types';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Permission {
  module: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_assign: boolean;
  can_export: boolean;
}

type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'export';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Permission hook.
 *
 * Loads the role-based permissions for the current user from the
 * `role_permissions` table and exposes helper functions to check access.
 *
 * Usage:
 * ```ts
 * const { hasPermission, isRoleAtLeast } = usePermissions();
 *
 * if (hasPermission('complaints', 'approve')) { ... }
 * if (isRoleAtLeast('secretary')) { ... }
 * ```
 */
export function usePermissions() {
  const { profile } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!profile?.role) return;

    if (USE_MOCK) {
      // Build permissions from the hardcoded ROLE_PERMISSIONS matrix in utils
      const ACTIONS: PermissionAction[] = ['create', 'read', 'update', 'delete', 'approve', 'assign', 'export'];
      const MODULES: Module[] = ['complaints', 'documents', 'dashboard', 'users', 'settings', 'announcements', 'reports'];
      const role = profile.role as UserRole;
      const perms: Permission[] = MODULES.map((mod) => {
        const perm: Permission = {
          module: mod,
          can_create: false,
          can_read: false,
          can_update: false,
          can_delete: false,
          can_approve: false,
          can_assign: false,
          can_export: false,
        };
        for (const action of ACTIONS) {
          (perm as any)[`can_${action}`] = checkPermission(role, mod, action);
        }
        return perm;
      });
      setPermissions(perms);
      setIsLoaded(true);
      return;
    }

    const loadPermissions = async () => {
      const { data } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', profile.role);

      if (data) setPermissions(data);
      setIsLoaded(true);
    };

    loadPermissions();
  }, [profile?.role]);

  /**
   * Check whether the current user has a specific permission on a module.
   */
  const hasPermission = useCallback(
    (module: string, action: PermissionAction): boolean => {
      const perm = permissions.find((p) => p.module === module);
      if (!perm) return false;
      return perm[`can_${action}`] ?? false;
    },
    [permissions],
  );

  /**
   * Check whether the current user's role meets or exceeds a minimum required
   * role based on the hierarchy defined in constants.
   */
  const isRoleAtLeast = useCallback(
    (minimumRole: string): boolean => {
      if (!profile?.role) return false;
      return checkRoleAtLeast(profile.role, minimumRole);
    },
    [profile?.role],
  );

  const isStaff = isRoleAtLeast('staff');
  const isSecretary = isRoleAtLeast('secretary');
  const isCaptain = isRoleAtLeast('captain');
  const isAdmin = isRoleAtLeast('system_admin');

  return {
    hasPermission,
    isRoleAtLeast,
    permissions,
    isLoaded,
    role: profile?.role,
    isStaff,
    isSecretary,
    isCaptain,
    isAdmin,
  };
}
