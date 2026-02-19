import { supabase } from '@/lib/supabase';
import { PAGINATION, ROLE_HIERARCHY } from '@/constants';
import type { Profile, AuditLog, DocumentFeeSchedule } from '@/types';
import { UserRole, DocumentType } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserFilters {
  role?: UserRole;
  isVerified?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogFilters {
  barangayId?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface SystemStats {
  totalUsers: number;
  totalComplaints: number;
  totalDocuments: number;
  totalBarangays: number;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[] | null;
  count: number;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// User Management
// ---------------------------------------------------------------------------

/**
 * List user profiles in a barangay with optional filters and pagination.
 */
export async function getUsers(
  barangayId: string,
  filters?: UserFilters,
): Promise<PaginatedResponse<Profile>> {
  try {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('barangay_id', barangayId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified);
    }

    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, count: 0, error };
    }

    return { data: data as Profile[], count: count ?? 0, error: null };
  } catch (error) {
    return { data: null, count: 0, error: error as Error };
  }
}

/**
 * Change a user's role.
 *
 * Caller must be captain+ and cannot:
 * - Promote someone to a role >= their own
 * - Change their own role (self-promotion)
 */
export async function updateUserRole(
  profileId: string,
  newRole: UserRole,
  callerProfileId: string,
  callerRole: UserRole,
): Promise<ServiceResponse<Profile>> {
  try {
    // Block: caller role must be captain+
    const callerLevel = ROLE_HIERARCHY[callerRole] ?? -1;
    if (callerLevel < (ROLE_HIERARCHY[UserRole.CAPTAIN] ?? Infinity)) {
      return { data: null, error: new Error('Only captain or higher can change user roles') };
    }

    // Block: self-promotion
    if (profileId === callerProfileId) {
      return { data: null, error: new Error('Cannot change your own role') };
    }

    // Block: promoting to >= own role
    const newLevel = ROLE_HIERARCHY[newRole] ?? Infinity;
    if (newLevel >= callerLevel) {
      return { data: null, error: new Error('Cannot promote a user to a role equal to or above your own') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Mark a user profile as verified.
 */
export async function verifyUser(
  profileId: string,
  verifiedBy: string,
): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: verifiedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

/**
 * Fetch audit log entries with optional filters and pagination.
 */
export async function getAuditLogs(
  filters?: AuditLogFilters,
): Promise<PaginatedResponse<AuditLog & { actor?: Profile }>> {
  try {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('audit_logs')
      .select(
        `
        *,
        actor:profiles!actor_id (
          id, first_name, last_name, avatar_url, role
        )
      `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.barangayId) {
      query = query.eq('barangay_id', filters.barangayId);
    }

    if (filters?.actorId) {
      query = query.eq('actor_id', filters.actorId);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, count: 0, error };
    }

    return {
      data: data as unknown as (AuditLog & { actor?: Profile })[],
      count: count ?? 0,
      error: null,
    };
  } catch (error) {
    return { data: null, count: 0, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// System Stats
// ---------------------------------------------------------------------------

/**
 * Retrieve high-level system counts: total users, complaints, document
 * requests, and barangays.
 */
export async function getSystemStats(): Promise<ServiceResponse<SystemStats>> {
  try {
    // Run all four counts in parallel
    const [usersRes, complaintsRes, documentsRes, barangaysRes] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('document_requests')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('barangays')
          .select('id', { count: 'exact', head: true }),
      ]);

    // If any query failed return the first error
    const firstError =
      usersRes.error ??
      complaintsRes.error ??
      documentsRes.error ??
      barangaysRes.error;

    if (firstError) {
      return { data: null, error: firstError };
    }

    return {
      data: {
        totalUsers: usersRes.count ?? 0,
        totalComplaints: complaintsRes.count ?? 0,
        totalDocuments: documentsRes.count ?? 0,
        totalBarangays: barangaysRes.count ?? 0,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Fee Schedule Management
// ---------------------------------------------------------------------------

/**
 * Update a document fee schedule entry.
 */
export async function updateFeeSchedule(
  id: string,
  fee: number,
  description?: string,
): Promise<ServiceResponse<DocumentFeeSchedule>> {
  try {
    const updatePayload: Record<string, unknown> = {
      fee,
      updated_at: new Date().toISOString(),
    };

    if (description !== undefined) {
      updatePayload.description = description;
    }

    const { data, error } = await supabase
      .from('document_fee_schedule')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentFeeSchedule, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
