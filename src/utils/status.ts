import { colors } from '../theme';
import {
  COMPLAINT_STATUS_TRANSITIONS,
  DOCUMENT_STATUS_TRANSITIONS,
} from '../constants';
import {
  ComplaintStatus,
  DocumentRequestStatus,
  ComplaintPriority,
} from '../types/enums';

// ---------------------------------------------------------------------------
// Status colours
// ---------------------------------------------------------------------------

/**
 * Get the theme colour for a given status string.
 * Falls back to grey if the status is not recognised.
 */
export function getStatusColor(status: string | null | undefined): string {
  if (!status) return colors.grey[500];
  return (colors.status as Record<string, string>)[status] ?? colors.grey[500];
}

/**
 * Get the theme colour for a complaint priority.
 */
export function getPriorityColor(priority: string | null | undefined): string {
  if (!priority) return colors.grey[500];
  return (colors.priority as Record<string, string>)[priority] ?? colors.grey[500];
}

// ---------------------------------------------------------------------------
// Light / background variants (20% opacity approximation)
// ---------------------------------------------------------------------------

/**
 * Return a light background colour for a status badge.
 */
export function getStatusBackgroundColor(status: string | null | undefined): string {
  if (!status) return colors.grey[100];
  const statusBgMap: Record<string, string> = {
    submitted: colors.secondary[50],
    under_review: '#FFF3E0',
    processing: '#FFF3E0',
    in_progress: '#F3E5F5',
    for_approval: '#EDE7F6',
    approved: colors.primary[50],
    for_release: '#E0F7FA',
    released: colors.primary[50],
    resolved: colors.primary[50],
    rejected: '#FFEBEE',
  };
  return statusBgMap[status] ?? colors.grey[100];
}

/**
 * Return a light background colour for a priority badge.
 */
export function getPriorityBackgroundColor(priority: string | null | undefined): string {
  if (!priority) return colors.grey[100];
  const priorityBgMap: Record<string, string> = {
    low: colors.primary[50],
    medium: '#FFF3E0',
    high: '#FFEBEE',
    urgent: '#FFCDD2',
  };
  return priorityBgMap[priority] ?? colors.grey[100];
}

// ---------------------------------------------------------------------------
// Next possible statuses
// ---------------------------------------------------------------------------

/**
 * Get the list of statuses a complaint can transition to from its current status.
 */
export function getNextComplaintStatuses(currentStatus: ComplaintStatus | string): string[] {
  return COMPLAINT_STATUS_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Get the list of statuses a document request can transition to from its current status.
 */
export function getNextDocumentStatuses(currentStatus: DocumentRequestStatus | string): string[] {
  return DOCUMENT_STATUS_TRANSITIONS[currentStatus] ?? [];
}

// ---------------------------------------------------------------------------
// Terminal status checks
// ---------------------------------------------------------------------------

/**
 * Return `true` if the complaint status is terminal (no further transitions).
 */
export function isTerminalComplaintStatus(status: ComplaintStatus | string): boolean {
  const next = COMPLAINT_STATUS_TRANSITIONS[status];
  return !next || next.length === 0;
}

/**
 * Return `true` if the document request status is terminal (no further transitions).
 */
export function isTerminalDocumentStatus(status: DocumentRequestStatus | string): boolean {
  const next = DOCUMENT_STATUS_TRANSITIONS[status];
  return !next || next.length === 0;
}

// ---------------------------------------------------------------------------
// Progress helpers
// ---------------------------------------------------------------------------

const COMPLAINT_STATUS_ORDER: string[] = [
  ComplaintStatus.SUBMITTED,
  ComplaintStatus.UNDER_REVIEW,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
];

const DOCUMENT_STATUS_ORDER: string[] = [
  DocumentRequestStatus.SUBMITTED,
  DocumentRequestStatus.PROCESSING,
  DocumentRequestStatus.FOR_APPROVAL,
  DocumentRequestStatus.APPROVED,
  DocumentRequestStatus.FOR_RELEASE,
  DocumentRequestStatus.RELEASED,
];

/**
 * Get a 0-1 progress value for a complaint status (useful for progress bars).
 * Rejected statuses return 1 (complete).
 */
export function getComplaintProgress(status: ComplaintStatus | string): number {
  if (status === ComplaintStatus.REJECTED) return 1;
  const idx = COMPLAINT_STATUS_ORDER.indexOf(status);
  if (idx === -1) return 0;
  return idx / (COMPLAINT_STATUS_ORDER.length - 1);
}

/**
 * Get a 0-1 progress value for a document request status.
 * Rejected statuses return 1 (complete).
 */
export function getDocumentProgress(status: DocumentRequestStatus | string): number {
  if (status === DocumentRequestStatus.REJECTED) return 1;
  const idx = DOCUMENT_STATUS_ORDER.indexOf(status);
  if (idx === -1) return 0;
  return idx / (DOCUMENT_STATUS_ORDER.length - 1);
}
