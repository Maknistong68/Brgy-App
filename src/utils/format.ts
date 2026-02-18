import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import {
  DOCUMENT_TYPE_LABELS,
  COMPLAINT_CATEGORY_LABELS,
} from '../constants';

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/**
 * Format a date string or Date object.
 * @param date  ISO string or Date instance
 * @param fmt   date-fns format token string (default: 'MMM d, yyyy')
 */
export function formatDate(date: string | Date | null | undefined, fmt = 'MMM d, yyyy'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, fmt);
}

/**
 * Format a date with time (e.g. "Jan 15, 2025 3:30 PM").
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

/**
 * Return a human-readable relative time string (e.g. "5 minutes ago").
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true });
}

// ---------------------------------------------------------------------------
// Reference numbers
// ---------------------------------------------------------------------------

/**
 * Format a padded reference number.
 * @param type    Prefix such as 'CMP' (complaint) or 'DOC' (document)
 * @param number  Numeric ID or sequence value
 * @returns       e.g. "CMP-00042"
 */
export function formatReferenceNumber(type: string, number: number | string): string {
  const padded = String(number).padStart(5, '0');
  return `${type.toUpperCase()}-${padded}`;
}

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

/**
 * Format an amount as Philippine Peso.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Phone number
// ---------------------------------------------------------------------------

/**
 * Format a Philippine phone number.
 * Input can be "09171234567" or "+639171234567"; output: "+63 917 123 4567".
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  // Strip non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Normalise to 12-digit international form (63XXXXXXXXXX)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '63' + digits.slice(1);
  }

  if (digits.length === 12 && digits.startsWith('63')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  // Fallback: return as-is
  return phone;
}

// ---------------------------------------------------------------------------
// Status / Priority / Category labels
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  processing: 'Processing',
  in_progress: 'In Progress',
  for_approval: 'For Approval',
  approved: 'Approved',
  for_release: 'For Release',
  released: 'Released',
  resolved: 'Resolved',
  rejected: 'Rejected',
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
  pending: 'Pending',
  paid: 'Paid',
  waived: 'Waived',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/**
 * Get a human-readable label for a status value.
 */
export function getStatusLabel(status: string | null | undefined): string {
  if (!status) return '';
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get a human-readable label for a priority value.
 */
export function getPriorityLabel(priority: string | null | undefined): string {
  if (!priority) return '';
  return PRIORITY_LABELS[priority] ?? priority.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get a human-readable label for a complaint category.
 */
export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return '';
  return COMPLAINT_CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get a human-readable label for a document type.
 */
export function getDocumentTypeLabel(type: string | null | undefined): string {
  if (!type) return '';
  return DOCUMENT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/**
 * Get initials from a first and last name (e.g. "MN" for Mark Nieva).
 */
export function getInitials(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const first = (firstName ?? '').trim().charAt(0).toUpperCase();
  const last = (lastName ?? '').trim().charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Truncate text to a maximum length, appending an ellipsis if needed.
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}
