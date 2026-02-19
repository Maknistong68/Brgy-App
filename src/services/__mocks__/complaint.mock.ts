import type {
  Complaint,
  ComplaintWithRelations,
  ComplaintStatusHistory,
  ComplaintComment,
  ComplaintAttachment,
  Profile,
} from '@/types';
import { ComplaintStatus, ComplaintPriority } from '@/types';
import { canTransitionComplaintStatus } from '@/utils/permissions';
import { PAGINATION } from '@/constants';
import type {
  ComplaintFilters,
  CreateComplaintData,
  FileInput,
  ServiceResponse,
  PaginatedResponse,
} from '../complaint.real';
import {
  complaints,
  complaintStatusHistory,
  complaintComments,
  complaintAttachments,
  profilesById,
  getCurrentUserId,
  profilesByUserId,
  MOCK_BARANGAY_ID,
  delay,
} from './mockDataStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function attachRelations(c: Complaint): ComplaintWithRelations {
  const complainant = profilesById.get(c.complainant_id);
  const assigned_staff = c.assigned_to ? profilesById.get(c.assigned_to) : undefined;
  return { ...c, complainant, assigned_staff };
}

let refCounter = complaints.size;

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

export async function getComplaints(
  filters: ComplaintFilters,
): Promise<PaginatedResponse<ComplaintWithRelations>> {
  await delay(300);

  let items = Array.from(complaints.values());

  if (filters.barangayId) {
    items = items.filter((c) => c.barangay_id === filters.barangayId);
  }
  if (filters.status) {
    items = items.filter((c) => c.status === filters.status);
  }
  if (filters.priority) {
    items = items.filter((c) => c.priority === filters.priority);
  }
  if (filters.category) {
    items = items.filter((c) => c.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (c) =>
        c.reference_number.toLowerCase().includes(q) ||
        c.respondent_name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }

  // Sort newest first
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

export async function getComplaintById(
  id: string,
): Promise<ServiceResponse<ComplaintWithRelations>> {
  await delay(200);
  const c = complaints.get(id);
  if (!c) return { data: null, error: new Error('Complaint not found') };
  return { data: attachRelations(c), error: null };
}

export async function createComplaint(
  input: CreateComplaintData,
): Promise<ServiceResponse<Complaint>> {
  await delay(300);
  refCounter++;
  const now = new Date().toISOString();
  const complaint: Complaint = {
    id: `complaint-new-${refCounter}`,
    barangay_id: input.barangay_id,
    reference_number: `CMP-2026-${String(refCounter + 100).padStart(4, '0')}`,
    complainant_id: input.complainant_id,
    respondent_name: input.respondent_name,
    respondent_address: input.respondent_address,
    category: input.category,
    description: input.description,
    priority: input.priority ?? ComplaintPriority.MEDIUM,
    status: ComplaintStatus.SUBMITTED,
    created_at: now,
    updated_at: now,
  };
  complaints.set(complaint.id, complaint);

  // Add initial status history
  complaintStatusHistory.push({
    id: `csh-new-${refCounter}`,
    complaint_id: complaint.id,
    from_status: null,
    to_status: ComplaintStatus.SUBMITTED,
    changed_by: input.complainant_id,
    notes: 'Complaint filed',
    created_at: now,
    updated_at: now,
  });

  return { data: { ...complaint }, error: null };
}

export async function updateComplaint(
  id: string,
  updates: Partial<Complaint>,
): Promise<ServiceResponse<Complaint>> {
  await delay(200);
  const c = complaints.get(id);
  if (!c) return { data: null, error: new Error('Complaint not found') };
  Object.assign(c, updates, { updated_at: new Date().toISOString() });
  return { data: { ...c }, error: null };
}

export async function updateComplaintStatus(
  id: string,
  newStatus: ComplaintStatus,
  changedBy: string,
  notes?: string,
): Promise<ServiceResponse<Complaint>> {
  await delay(300);
  const c = complaints.get(id);
  if (!c) return { data: null, error: new Error('Complaint not found') };

  const previousStatus = c.status;
  if (!canTransitionComplaintStatus(previousStatus, newStatus)) {
    return {
      data: null,
      error: new Error(`Invalid status transition from '${previousStatus}' to '${newStatus}'`),
    };
  }

  const now = new Date().toISOString();
  c.status = newStatus;
  c.updated_at = now;

  if (newStatus === ComplaintStatus.RESOLVED) {
    c.resolved_at = now;
    if (notes) c.resolution_notes = notes;
  }

  complaintStatusHistory.push({
    id: `csh-rt-${Date.now()}`,
    complaint_id: id,
    from_status: previousStatus,
    to_status: newStatus,
    changed_by: changedBy,
    notes: notes ?? null,
    created_at: now,
    updated_at: now,
  } as ComplaintStatusHistory);

  return { data: { ...c }, error: null };
}

export async function assignComplaint(
  id: string,
  assigneeId: string,
): Promise<ServiceResponse<Complaint>> {
  await delay(200);
  const c = complaints.get(id);
  if (!c) return { data: null, error: new Error('Complaint not found') };
  c.assigned_to = assigneeId;
  c.updated_at = new Date().toISOString();
  return { data: { ...c }, error: null };
}

// ---------------------------------------------------------------------------
// Status History
// ---------------------------------------------------------------------------

export async function getStatusHistory(
  complaintId: string,
): Promise<ServiceResponse<(ComplaintStatusHistory & { changed_by_profile?: Profile })[]>> {
  await delay(200);
  const entries = complaintStatusHistory
    .filter((h) => h.complaint_id === complaintId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((h) => ({
      ...h,
      changed_by_profile: profilesById.get(h.changed_by),
    }));
  return { data: entries, error: null };
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getComments(
  complaintId: string,
  includeInternal: boolean = false,
): Promise<ServiceResponse<(ComplaintComment & { author?: Profile })[]>> {
  await delay(200);
  let items = Array.from(complaintComments.values()).filter(
    (c) => c.complaint_id === complaintId,
  );
  if (!includeInternal) {
    items = items.filter((c) => !c.is_internal);
  }
  items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const result = items.map((c) => ({
    ...c,
    author: profilesById.get(c.author_id),
  }));
  return { data: result, error: null };
}

export async function addComment(
  complaintId: string,
  authorId: string,
  content: string,
  isInternal: boolean = false,
): Promise<ServiceResponse<ComplaintComment>> {
  await delay(200);
  const now = new Date().toISOString();
  const comment: ComplaintComment = {
    id: `cc-new-${Date.now()}`,
    complaint_id: complaintId,
    author_id: authorId,
    content,
    is_internal: isInternal,
    created_at: now,
    updated_at: now,
  };
  complaintComments.set(comment.id, comment);
  return { data: { ...comment }, error: null };
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export async function getAttachments(
  complaintId: string,
): Promise<ServiceResponse<ComplaintAttachment[]>> {
  await delay(200);
  const items = Array.from(complaintAttachments.values())
    .filter((a) => a.complaint_id === complaintId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return { data: items.map((a) => ({ ...a })), error: null };
}

export async function addAttachment(
  complaintId: string,
  uploadedBy: string,
  file: FileInput,
): Promise<ServiceResponse<ComplaintAttachment>> {
  await delay(300);
  const now = new Date().toISOString();
  const att: ComplaintAttachment = {
    id: `ca-new-${Date.now()}`,
    complaint_id: complaintId,
    uploaded_by: uploadedBy,
    file_name: file.name,
    file_path: `${complaintId}/${Date.now()}_${file.name}`,
    mime_type: file.type,
    file_size: file.size,
    created_at: now,
    updated_at: now,
  };
  complaintAttachments.set(att.id, att);
  return { data: { ...att }, error: null };
}

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

export async function archiveComplaint(
  id: string,
): Promise<ServiceResponse<Complaint>> {
  await delay(200);
  const c = complaints.get(id);
  if (!c) return { data: null, error: new Error('Complaint not found') };
  (c as any).archived_at = new Date().toISOString();
  return { data: { ...c }, error: null };
}
