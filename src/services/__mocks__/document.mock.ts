import type {
  DocumentRequest,
  DocumentRequestWithRelations,
  DocumentRequestStatusHistory,
  DocumentRequestAttachment,
  DocumentFeeSchedule,
  Profile,
} from '@/types';
import { DocumentRequestStatus, DocumentType, PaymentStatus } from '@/types';
import { canTransitionDocumentStatus } from '@/utils/permissions';
import { PAGINATION } from '@/constants';
import type {
  DocumentFilters,
  CreateDocumentRequestData,
  FileInput,
  ServiceResponse,
  PaginatedResponse,
} from '../document.real';
import {
  documentRequests,
  documentStatusHistory,
  documentAttachments,
  feeSchedule,
  profilesById,
  MOCK_BARANGAY_ID,
  delay,
} from './mockDataStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function attachRelations(d: DocumentRequest): DocumentRequestWithRelations {
  const requestor = profilesById.get(d.requestor_id);
  const processor = d.processed_by ? profilesById.get(d.processed_by) : undefined;
  const approver = d.approved_by ? profilesById.get(d.approved_by) : undefined;
  return { ...d, requestor, processor, approver };
}

let refCounter = documentRequests.size;

// ---------------------------------------------------------------------------
// Document Requests
// ---------------------------------------------------------------------------

export async function getDocumentRequests(
  filters: DocumentFilters,
): Promise<PaginatedResponse<DocumentRequestWithRelations>> {
  await delay(300);

  let items = Array.from(documentRequests.values());

  if (filters.barangayId) {
    items = items.filter((d) => d.barangay_id === filters.barangayId);
  }
  if (filters.status) {
    items = items.filter((d) => d.status === filters.status);
  }
  if (filters.documentType) {
    items = items.filter((d) => d.document_type === filters.documentType);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (d) =>
        d.reference_number.toLowerCase().includes(q) ||
        d.purpose.toLowerCase().includes(q),
    );
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const paged = items.slice(from, from + pageSize);

  return {
    data: paged.map(attachRelations),
    count: items.length,
    error: null,
  };
}

export async function getDocumentRequestById(
  id: string,
): Promise<ServiceResponse<DocumentRequestWithRelations>> {
  await delay(200);
  const d = documentRequests.get(id);
  if (!d) return { data: null, error: new Error('Document request not found') };
  return { data: attachRelations(d), error: null };
}

export async function createDocumentRequest(
  input: CreateDocumentRequestData,
): Promise<ServiceResponse<DocumentRequest>> {
  await delay(300);
  refCounter++;
  const now = new Date().toISOString();
  const doc: DocumentRequest = {
    id: `doc-new-${refCounter}`,
    barangay_id: input.barangay_id,
    reference_number: `DOC-2026-${String(refCounter + 100).padStart(4, '0')}`,
    requestor_id: input.requestor_id,
    document_type: input.document_type,
    form_data: input.form_data,
    purpose: input.purpose,
    status: DocumentRequestStatus.SUBMITTED,
    payment_status: PaymentStatus.PENDING,
    created_at: now,
    updated_at: now,
  };
  documentRequests.set(doc.id, doc);

  documentStatusHistory.push({
    id: `dsh-new-${refCounter}`,
    document_request_id: doc.id,
    from_status: null,
    to_status: DocumentRequestStatus.SUBMITTED,
    changed_by: input.requestor_id,
    notes: 'Request submitted',
    created_at: now,
    updated_at: now,
  });

  return { data: { ...doc }, error: null };
}

export async function updateDocumentRequest(
  id: string,
  updates: Partial<DocumentRequest>,
): Promise<ServiceResponse<DocumentRequest>> {
  await delay(200);
  const d = documentRequests.get(id);
  if (!d) return { data: null, error: new Error('Document request not found') };
  Object.assign(d, updates, { updated_at: new Date().toISOString() });
  return { data: { ...d }, error: null };
}

export async function updateDocumentStatus(
  id: string,
  newStatus: DocumentRequestStatus,
  changedBy: string,
  notes?: string,
): Promise<ServiceResponse<DocumentRequest>> {
  await delay(300);
  const d = documentRequests.get(id);
  if (!d) return { data: null, error: new Error('Document request not found') };

  const previousStatus = d.status;
  if (!canTransitionDocumentStatus(previousStatus, newStatus)) {
    return {
      data: null,
      error: new Error(`Invalid status transition from '${previousStatus}' to '${newStatus}'`),
    };
  }

  // Enforce payment before release
  if (newStatus === DocumentRequestStatus.FOR_RELEASE) {
    const requiresPayment = d.amount != null && d.amount > 0;
    const isPaid = d.payment_status === PaymentStatus.PAID || d.payment_status === PaymentStatus.WAIVED;
    if (requiresPayment && !isPaid) {
      return {
        data: null,
        error: new Error('Payment must be completed or waived before releasing the document'),
      };
    }
  }

  const now = new Date().toISOString();
  d.status = newStatus;
  d.updated_at = now;

  if (newStatus === DocumentRequestStatus.RELEASED) {
    d.released_at = now;
  }
  if (newStatus === DocumentRequestStatus.REJECTED && notes) {
    d.rejection_reason = notes;
  }

  documentStatusHistory.push({
    id: `dsh-rt-${Date.now()}`,
    document_request_id: id,
    from_status: previousStatus,
    to_status: newStatus,
    changed_by: changedBy,
    notes: notes ?? null,
    created_at: now,
    updated_at: now,
  } as DocumentRequestStatusHistory);

  return { data: { ...d }, error: null };
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  amount?: number,
): Promise<ServiceResponse<DocumentRequest>> {
  await delay(200);
  const d = documentRequests.get(id);
  if (!d) return { data: null, error: new Error('Document request not found') };
  d.payment_status = paymentStatus;
  if (amount !== undefined) d.amount = amount;
  d.updated_at = new Date().toISOString();
  return { data: { ...d }, error: null };
}

// ---------------------------------------------------------------------------
// Status History
// ---------------------------------------------------------------------------

export async function getStatusHistory(
  requestId: string,
): Promise<ServiceResponse<(DocumentRequestStatusHistory & { changed_by_profile?: Profile })[]>> {
  await delay(200);
  const entries = documentStatusHistory
    .filter((h) => h.document_request_id === requestId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((h) => ({
      ...h,
      changed_by_profile: profilesById.get(h.changed_by),
    }));
  return { data: entries, error: null };
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export async function getAttachments(
  requestId: string,
): Promise<ServiceResponse<DocumentRequestAttachment[]>> {
  await delay(200);
  const items = Array.from(documentAttachments.values())
    .filter((a) => a.document_request_id === requestId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return { data: items.map((a) => ({ ...a })), error: null };
}

export async function addAttachment(
  requestId: string,
  uploadedBy: string,
  file: FileInput,
): Promise<ServiceResponse<DocumentRequestAttachment>> {
  await delay(300);
  const now = new Date().toISOString();
  const att: DocumentRequestAttachment = {
    id: `da-new-${Date.now()}`,
    document_request_id: requestId,
    uploaded_by: uploadedBy,
    file_name: file.name,
    file_path: `${requestId}/${Date.now()}_${file.name}`,
    mime_type: file.type,
    file_size: file.size,
    created_at: now,
    updated_at: now,
  };
  documentAttachments.set(att.id, att);
  return { data: { ...att }, error: null };
}

// ---------------------------------------------------------------------------
// Fee Schedule
// ---------------------------------------------------------------------------

export async function getFeeSchedule(
  barangayId: string,
): Promise<ServiceResponse<DocumentFeeSchedule[]>> {
  await delay(200);
  const items = Array.from(feeSchedule.values())
    .filter((f) => f.barangay_id === barangayId && f.is_active)
    .sort((a, b) => a.document_type.localeCompare(b.document_type));
  return { data: items.map((f) => ({ ...f })), error: null };
}

export async function getFee(
  barangayId: string,
  documentType: DocumentType,
): Promise<ServiceResponse<DocumentFeeSchedule>> {
  await delay(200);
  const entry = Array.from(feeSchedule.values()).find(
    (f) => f.barangay_id === barangayId && f.document_type === documentType && f.is_active,
  );
  if (!entry) return { data: null, error: new Error('Fee not found') };
  return { data: { ...entry }, error: null };
}

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

export async function archiveDocumentRequest(
  id: string,
): Promise<ServiceResponse<DocumentRequest>> {
  await delay(200);
  const d = documentRequests.get(id);
  if (!d) return { data: null, error: new Error('Document request not found') };
  (d as any).archived_at = new Date().toISOString();
  return { data: { ...d }, error: null };
}
