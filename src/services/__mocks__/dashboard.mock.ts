import { ComplaintStatus } from '@/types';
import type {
  DateRange,
  ComplaintStats,
  DocumentStats,
  RecentActivityItem,
  ResolutionMetrics,
  MonthlyTrendItem,
  ServiceResponse,
} from '../dashboard.real';
import {
  complaints,
  documentRequests,
  delay,
} from './mockDataStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inRange(dateStr: string, range?: DateRange): boolean {
  if (!range) return true;
  if (range.from && dateStr < range.from) return false;
  if (range.to && dateStr > range.to) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Dashboard Service (Mock)
// ---------------------------------------------------------------------------

export async function getComplaintStats(
  barangayId: string,
  dateRange?: DateRange,
): Promise<ServiceResponse<ComplaintStats>> {
  await delay(200);

  const rows = Array.from(complaints.values()).filter(
    (c) => c.barangay_id === barangayId && inRange(c.created_at, dateRange),
  );

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    byPriority[row.priority] = (byPriority[row.priority] ?? 0) + 1;
  }

  return {
    data: { total: rows.length, byStatus, byPriority },
    error: null,
  };
}

export async function getDocumentStats(
  barangayId: string,
  dateRange?: DateRange,
): Promise<ServiceResponse<DocumentStats>> {
  await delay(200);

  const rows = Array.from(documentRequests.values()).filter(
    (d) => d.barangay_id === barangayId && inRange(d.created_at, dateRange),
  );

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    byType[row.document_type] = (byType[row.document_type] ?? 0) + 1;
  }

  return {
    data: { total: rows.length, byStatus, byType },
    error: null,
  };
}

export async function getRecentActivity(
  barangayId: string,
  limit: number = 10,
): Promise<ServiceResponse<RecentActivityItem[]>> {
  await delay(200);

  const complaintItems: RecentActivityItem[] = Array.from(complaints.values())
    .filter((c) => c.barangay_id === barangayId)
    .map((c) => ({
      id: c.id,
      type: 'complaint' as const,
      reference_number: c.reference_number,
      title: c.category,
      status: c.status,
      created_at: c.created_at,
    }));

  const documentItems: RecentActivityItem[] = Array.from(documentRequests.values())
    .filter((d) => d.barangay_id === barangayId)
    .map((d) => ({
      id: d.id,
      type: 'document' as const,
      reference_number: d.reference_number,
      title: d.document_type,
      status: d.status,
      created_at: d.created_at,
    }));

  const merged = [...complaintItems, ...documentItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  return { data: merged, error: null };
}

export async function getResolutionMetrics(
  barangayId: string,
  dateRange?: DateRange,
): Promise<ServiceResponse<ResolutionMetrics>> {
  await delay(200);

  const rows = Array.from(complaints.values()).filter(
    (c) => c.barangay_id === barangayId && inRange(c.created_at, dateRange),
  );

  let totalResolved = 0;
  let totalRejected = 0;
  let totalResolutionMs = 0;
  let resolvedWithTime = 0;

  for (const row of rows) {
    if (row.status === ComplaintStatus.RESOLVED) {
      totalResolved += 1;
      if (row.resolved_at) {
        const diff =
          new Date(row.resolved_at).getTime() - new Date(row.created_at).getTime();
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
    data: { totalResolved, totalRejected, avgResolutionDays },
    error: null,
  };
}

export async function getMonthlyTrends(
  barangayId: string,
  months: number = 6,
): Promise<ServiceResponse<MonthlyTrendItem[]>> {
  await delay(200);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  const startIso = startDate.toISOString();

  const cItems = Array.from(complaints.values()).filter(
    (c) => c.barangay_id === barangayId && c.created_at >= startIso,
  );
  const dItems = Array.from(documentRequests.values()).filter(
    (d) => d.barangay_id === barangayId && d.created_at >= startIso,
  );

  const buckets: Record<string, MonthlyTrendItem> = {};
  for (let i = 0; i <= months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { month: key, complaints: 0, documents: 0 };
  }

  for (const c of cItems) {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) buckets[key].complaints += 1;
  }

  for (const doc of dItems) {
    const d = new Date(doc.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) buckets[key].documents += 1;
  }

  const trends = Object.values(buckets).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  return { data: trends, error: null };
}
