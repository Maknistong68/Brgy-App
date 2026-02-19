import type { Profile, AuditLog, DocumentFeeSchedule } from '@/types';
import { UserRole } from '@/types';
import { PAGINATION, ROLE_HIERARCHY } from '@/constants';
import type {
  UserFilters,
  AuditLogFilters,
  SystemStats,
  ServiceResponse,
  PaginatedResponse,
} from '../admin.real';
import {
  profilesById,
  complaints,
  documentRequests,
  auditLogs,
  feeSchedule,
  MOCK_BARANGAY_ID,
  delay,
} from './mockDataStore';

// ---------------------------------------------------------------------------
// User Management
// ---------------------------------------------------------------------------

export async function getUsers(
  barangayId: string,
  filters?: UserFilters,
): Promise<PaginatedResponse<Profile>> {
  await delay(200);

  let members = Array.from(profilesById.values()).filter(
    (p) => p.barangay_id === barangayId,
  );

  if (filters?.role) {
    members = members.filter((p) => p.role === filters.role);
  }
  if (filters?.isVerified !== undefined) {
    members = members.filter((p) => p.is_verified === filters.isVerified);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    members = members.filter(
      (p) =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q),
    );
  }

  members.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const paged = members.slice(from, from + pageSize);

  return { data: paged.map((p) => ({ ...p })), count: members.length, error: null };
}

export async function updateUserRole(
  profileId: string,
  newRole: UserRole,
  callerProfileId: string,
  callerRole: UserRole,
): Promise<ServiceResponse<Profile>> {
  await delay(200);

  const callerLevel = ROLE_HIERARCHY[callerRole] ?? -1;
  if (callerLevel < (ROLE_HIERARCHY[UserRole.CAPTAIN] ?? Infinity)) {
    return { data: null, error: new Error('Only captain or higher can change user roles') };
  }
  if (profileId === callerProfileId) {
    return { data: null, error: new Error('Cannot change your own role') };
  }
  const newLevel = ROLE_HIERARCHY[newRole] ?? Infinity;
  if (newLevel >= callerLevel) {
    return { data: null, error: new Error('Cannot promote a user to a role equal to or above your own') };
  }

  const p = profilesById.get(profileId);
  if (!p) return { data: null, error: new Error('Profile not found') };
  p.role = newRole;
  p.updated_at = new Date().toISOString();
  return { data: { ...p }, error: null };
}

export async function verifyUser(
  profileId: string,
  verifiedBy: string,
): Promise<ServiceResponse<Profile>> {
  await delay(200);
  const p = profilesById.get(profileId);
  if (!p) return { data: null, error: new Error('Profile not found') };
  const now = new Date().toISOString();
  p.is_verified = true;
  p.verified_at = now;
  p.verified_by = verifiedBy;
  p.updated_at = now;
  return { data: { ...p }, error: null };
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export async function getAuditLogs(
  filters?: AuditLogFilters,
): Promise<PaginatedResponse<AuditLog & { actor?: Profile }>> {
  await delay(200);

  let items = [...auditLogs];

  if (filters?.barangayId) {
    items = items.filter((l) => l.barangay_id === filters.barangayId);
  }
  if (filters?.actorId) {
    items = items.filter((l) => l.actor_id === filters.actorId);
  }
  if (filters?.action) {
    items = items.filter((l) => l.action === filters.action);
  }
  if (filters?.resourceType) {
    items = items.filter((l) => l.resource_type === filters.resourceType);
  }
  if (filters?.dateFrom) {
    items = items.filter((l) => l.created_at >= filters.dateFrom!);
  }
  if (filters?.dateTo) {
    items = items.filter((l) => l.created_at <= filters.dateTo!);
  }

  items.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const paged = items.slice(from, from + pageSize);

  const result = paged.map((l) => ({
    ...l,
    actor: profilesById.get(l.actor_id),
  }));

  return { data: result, count: items.length, error: null };
}

// ---------------------------------------------------------------------------
// System Stats
// ---------------------------------------------------------------------------

export async function getSystemStats(): Promise<ServiceResponse<SystemStats>> {
  await delay(200);
  return {
    data: {
      totalUsers: profilesById.size,
      totalComplaints: complaints.size,
      totalDocuments: documentRequests.size,
      totalBarangays: 1, // single mock barangay
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Fee Schedule Management
// ---------------------------------------------------------------------------

export async function updateFeeSchedule(
  id: string,
  fee: number,
  description?: string,
): Promise<ServiceResponse<DocumentFeeSchedule>> {
  await delay(200);
  const entry = feeSchedule.get(id);
  if (!entry) return { data: null, error: new Error('Fee schedule entry not found') };
  entry.fee = fee;
  if (description !== undefined) entry.description = description;
  entry.updated_at = new Date().toISOString();
  return { data: { ...entry }, error: null };
}
