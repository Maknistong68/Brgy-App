import { supabase } from '@/lib/supabase';
import {
  ComplaintStatus,
  ComplaintPriority,
  DocumentRequestStatus,
  DocumentType,
} from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DateRange {
  from: string; // ISO date string
  to: string;   // ISO date string
}

export interface ComplaintStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface DocumentStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export interface RecentActivityItem {
  id: string;
  type: 'complaint' | 'document';
  reference_number: string;
  title: string;
  status: string;
  created_at: string;
}

export interface ResolutionMetrics {
  totalResolved: number;
  totalRejected: number;
  avgResolutionDays: number | null;
}

export interface MonthlyTrendItem {
  month: string; // YYYY-MM
  complaints: number;
  documents: number;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyDateRange(
  query: any,
  dateRange?: DateRange,
  column: string = 'created_at',
) {
  if (dateRange?.from) {
    query = query.gte(column, dateRange.from);
  }
  if (dateRange?.to) {
    query = query.lte(column, dateRange.to);
  }
  return query;
}

// ---------------------------------------------------------------------------
// Dashboard Service
// ---------------------------------------------------------------------------

/**
 * Aggregate complaint counts grouped by status and priority.
 */
export async function getComplaintStats(
  barangayId: string,
  dateRange?: DateRange,
): Promise<ServiceResponse<ComplaintStats>> {
  try {
    let query = supabase
      .from('complaints')
      .select('id, status, priority')
      .eq('barangay_id', barangayId);

    query = applyDateRange(query, dateRange);

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    const rows = data as { id: string; status: string; priority: string }[];

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
      byPriority[row.priority] = (byPriority[row.priority] ?? 0) + 1;
    }

    return {
      data: {
        total: rows.length,
        byStatus,
        byPriority,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Aggregate document-request counts grouped by status and document type.
 */
export async function getDocumentStats(
  barangayId: string,
  dateRange?: DateRange,
): Promise<ServiceResponse<DocumentStats>> {
  try {
    let query = supabase
      .from('document_requests')
      .select('id, status, document_type')
      .eq('barangay_id', barangayId);

    query = applyDateRange(query, dateRange);

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    const rows = data as { id: string; status: string; document_type: string }[];

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
      byType[row.document_type] = (byType[row.document_type] ?? 0) + 1;
    }

    return {
      data: {
        total: rows.length,
        byStatus,
        byType,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Return the most-recent complaints and document requests, interleaved and
 * sorted by creation date.
 */
export async function getRecentActivity(
  barangayId: string,
  limit: number = 10,
): Promise<ServiceResponse<RecentActivityItem[]>> {
  try {
    // Fetch recent complaints
    const { data: complaints, error: cError } = await supabase
      .from('complaints')
      .select('id, reference_number, category, status, created_at')
      .eq('barangay_id', barangayId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cError) {
      return { data: null, error: cError };
    }

    // Fetch recent document requests
    const { data: documents, error: dError } = await supabase
      .from('document_requests')
      .select('id, reference_number, document_type, status, created_at')
      .eq('barangay_id', barangayId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dError) {
      return { data: null, error: dError };
    }

    // Map and merge
    const complaintItems: RecentActivityItem[] = (complaints ?? []).map(
      (c: any) => ({
        id: c.id,
        type: 'complaint' as const,
        reference_number: c.reference_number,
        title: c.category,
        status: c.status,
        created_at: c.created_at,
      }),
    );

    const documentItems: RecentActivityItem[] = (documents ?? []).map(
      (d: any) => ({
        id: d.id,
        type: 'document' as const,
        reference_number: d.reference_number,
        title: d.document_type,
        status: d.status,
        created_at: d.created_at,
      }),
    );

    const merged = [...complaintItems, ...documentItems]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, limit);

    return { data: merged, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Calculate resolution metrics: total resolved, total rejected, and average
 * resolution time in days.
 */
export async function getResolutionMetrics(
  barangayId: string,
  dateRange?: DateRange,
): Promise<ServiceResponse<ResolutionMetrics>> {
  try {
    let query = supabase
      .from('complaints')
      .select('id, status, created_at, resolved_at')
      .eq('barangay_id', barangayId);

    query = applyDateRange(query, dateRange);

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    const rows = data as {
      id: string;
      status: string;
      created_at: string;
      resolved_at: string | null;
    }[];

    let totalResolved = 0;
    let totalRejected = 0;
    let totalResolutionMs = 0;
    let resolvedWithTime = 0;

    for (const row of rows) {
      if (row.status === ComplaintStatus.RESOLVED) {
        totalResolved += 1;
        if (row.resolved_at) {
          const diff =
            new Date(row.resolved_at).getTime() -
            new Date(row.created_at).getTime();
          totalResolutionMs += diff;
          resolvedWithTime += 1;
        }
      } else if (row.status === ComplaintStatus.REJECTED) {
        totalRejected += 1;
      }
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const avgResolutionDays =
      resolvedWithTime > 0
        ? Math.round((totalResolutionMs / resolvedWithTime / MS_PER_DAY) * 10) / 10
        : null;

    return {
      data: {
        totalResolved,
        totalRejected,
        avgResolutionDays,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Return monthly complaint and document-request counts for the last N months.
 */
export async function getMonthlyTrends(
  barangayId: string,
  months: number = 6,
): Promise<ServiceResponse<MonthlyTrendItem[]>> {
  try {
    // Calculate the start date
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const startIso = startDate.toISOString();

    // Fetch complaints in range
    const { data: complaints, error: cError } = await supabase
      .from('complaints')
      .select('id, created_at')
      .eq('barangay_id', barangayId)
      .gte('created_at', startIso);

    if (cError) {
      return { data: null, error: cError };
    }

    // Fetch document requests in range
    const { data: documents, error: dError } = await supabase
      .from('document_requests')
      .select('id, created_at')
      .eq('barangay_id', barangayId)
      .gte('created_at', startIso);

    if (dError) {
      return { data: null, error: dError };
    }

    // Build month buckets
    const buckets: Record<string, MonthlyTrendItem> = {};

    for (let i = 0; i <= months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (months - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets[key] = { month: key, complaints: 0, documents: 0 };
    }

    for (const c of complaints ?? []) {
      const d = new Date((c as any).created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets[key]) {
        buckets[key].complaints += 1;
      }
    }

    for (const doc of documents ?? []) {
      const d = new Date((doc as any).created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets[key]) {
        buckets[key].documents += 1;
      }
    }

    const trends = Object.values(buckets).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    return { data: trends, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
