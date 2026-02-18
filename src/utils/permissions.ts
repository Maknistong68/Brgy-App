import { UserRole, ComplaintStatus, DocumentRequestStatus } from '../types/enums';
import {
  ROLE_HIERARCHY,
  COMPLAINT_STATUS_TRANSITIONS,
  DOCUMENT_STATUS_TRANSITIONS,
} from '../constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'assign' | 'export';

export type Module =
  | 'complaints'
  | 'documents'
  | 'dashboard'
  | 'users'
  | 'settings'
  | 'announcements'
  | 'reports';

export type PermissionMatrix = Record<string, Record<Action, boolean>>;

// ---------------------------------------------------------------------------
// Default RBAC permission matrix per role
// ---------------------------------------------------------------------------

const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<Module, Partial<Record<Action, boolean>>>>> = {
  [UserRole.RESIDENT]: {
    complaints: { create: true, read: true, update: false, delete: false, approve: false, assign: false, export: false },
    documents: { create: true, read: true, update: false, delete: false, approve: false, assign: false, export: false },
    dashboard: { read: true },
    announcements: { read: true },
  },
  [UserRole.STAFF]: {
    complaints: { create: true, read: true, update: true, delete: false, approve: false, assign: false, export: true },
    documents: { create: true, read: true, update: true, delete: false, approve: false, assign: false, export: true },
    dashboard: { read: true },
    users: { read: true },
    announcements: { read: true, create: true, update: true },
    reports: { read: true },
  },
  [UserRole.SECRETARY]: {
    complaints: { create: true, read: true, update: true, delete: false, approve: true, assign: true, export: true },
    documents: { create: true, read: true, update: true, delete: false, approve: true, assign: true, export: true },
    dashboard: { read: true },
    users: { read: true, update: true },
    announcements: { read: true, create: true, update: true, delete: true },
    reports: { read: true, export: true },
  },
  [UserRole.TREASURER]: {
    complaints: { read: true },
    documents: { create: true, read: true, update: true, delete: false, approve: false, assign: false, export: true },
    dashboard: { read: true },
    users: { read: true },
    announcements: { read: true, create: true, update: true },
    reports: { read: true, export: true },
  },
  [UserRole.CAPTAIN]: {
    complaints: { create: true, read: true, update: true, delete: true, approve: true, assign: true, export: true },
    documents: { create: true, read: true, update: true, delete: true, approve: true, assign: true, export: true },
    dashboard: { read: true },
    users: { read: true, create: true, update: true, delete: true },
    settings: { read: true, update: true },
    announcements: { read: true, create: true, update: true, delete: true },
    reports: { read: true, create: true, export: true },
  },
  [UserRole.SYSTEM_ADMIN]: {
    complaints: { create: true, read: true, update: true, delete: true, approve: true, assign: true, export: true },
    documents: { create: true, read: true, update: true, delete: true, approve: true, assign: true, export: true },
    dashboard: { read: true },
    users: { read: true, create: true, update: true, delete: true },
    settings: { read: true, create: true, update: true, delete: true },
    announcements: { read: true, create: true, update: true, delete: true },
    reports: { read: true, create: true, export: true },
  },
};

// ---------------------------------------------------------------------------
// Role hierarchy check
// ---------------------------------------------------------------------------

/**
 * Check if a user's role meets or exceeds a minimum required role.
 */
export function isRoleAtLeast(userRole: UserRole | string, minimumRole: UserRole | string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const minimumLevel = ROLE_HIERARCHY[minimumRole] ?? Infinity;
  return userLevel >= minimumLevel;
}

// ---------------------------------------------------------------------------
// Permission check (RBAC matrix)
// ---------------------------------------------------------------------------

/**
 * Check if a given role's permission set allows a specific action on a module.
 * Accepts either the built-in RBAC matrix (by role) or a custom permission
 * record (e.g. from the database).
 */
export function hasPermission(
  roleOrPermissions: UserRole | string | PermissionMatrix,
  module: Module,
  action: Action,
): boolean {
  // If a custom permission matrix object is provided
  if (typeof roleOrPermissions === 'object') {
    return roleOrPermissions[module]?.[action] === true;
  }

  // Otherwise treat as a UserRole key
  const role = roleOrPermissions as UserRole;
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;

  const modulePerms = rolePerms[module];
  if (!modulePerms) return false;

  return modulePerms[action] === true;
}

// ---------------------------------------------------------------------------
// Status transition checks
// ---------------------------------------------------------------------------

/**
 * Check whether a complaint can transition from `currentStatus` to `newStatus`.
 */
export function canTransitionComplaintStatus(
  currentStatus: ComplaintStatus | string,
  newStatus: ComplaintStatus | string,
): boolean {
  const allowed = COMPLAINT_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}

/**
 * Check whether a document request can transition from `currentStatus` to `newStatus`.
 */
export function canTransitionDocumentStatus(
  currentStatus: DocumentRequestStatus | string,
  newStatus: DocumentRequestStatus | string,
): boolean {
  const allowed = DOCUMENT_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}
