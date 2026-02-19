import type {
  Profile,
  Complaint,
  ComplaintWithRelations,
  ComplaintStatusHistory,
  ComplaintComment,
  ComplaintAttachment,
  DocumentRequest,
  DocumentRequestStatusHistory,
  DocumentRequestAttachment,
  DocumentFeeSchedule,
  Hearing,
  HearingAttendee,
  Notification,
  Announcement,
  AuditLog,
} from '@/types';
import {
  UserRole,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
  DocumentType,
  DocumentRequestStatus,
  PaymentStatus,
  HearingStatus,
  NotificationType,
  Gender,
  CivilStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let _currentUserId: string | null = null;
export function getCurrentUserId(): string | null {
  return _currentUserId;
}
export function setCurrentUserId(id: string | null) {
  _currentUserId = id;
}

function uuid(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Barangay
// ---------------------------------------------------------------------------

export const MOCK_BARANGAY_ID = 'brgy-001';

// ---------------------------------------------------------------------------
// Profiles (10 users)
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

function makeProfile(
  n: number,
  userId: string,
  email: string,
  first: string,
  last: string,
  role: UserRole,
  extra?: Partial<Profile>,
): Profile {
  return {
    id: uuid('profile', n),
    user_id: userId,
    barangay_id: MOCK_BARANGAY_ID,
    first_name: first,
    last_name: last,
    middle_name: null,
    suffix: null,
    email,
    phone: `+6391700000${String(n).padStart(2, '0')}`,
    role,
    avatar_url: null,
    address: `${100 + n} Rizal St., San Antonio`,
    purok: `Purok ${(n % 5) + 1}`,
    date_of_birth: '1990-01-15',
    gender: n % 2 === 0 ? Gender.MALE : Gender.FEMALE,
    civil_status: CivilStatus.SINGLE,
    is_verified: true,
    verified_at: now,
    verified_by: null,
    created_at: daysAgo(90),
    updated_at: now,
    ...extra,
  };
}

const profilesList: Profile[] = [
  makeProfile(1, 'mock-resident-brgyapp-com', 'resident@brgyapp.com', 'Juan', 'Dela Cruz', UserRole.RESIDENT),
  makeProfile(2, 'mock-staff-brgyapp-com', 'staff@brgyapp.com', 'Maria', 'Santos', UserRole.STAFF),
  makeProfile(3, 'mock-secretary-brgyapp-com', 'secretary@brgyapp.com', 'Ana', 'Reyes', UserRole.SECRETARY),
  makeProfile(4, 'mock-treasurer-brgyapp-com', 'treasurer@brgyapp.com', 'Pedro', 'Garcia', UserRole.TREASURER),
  makeProfile(5, 'mock-captain-brgyapp-com', 'captain@brgyapp.com', 'Roberto', 'Mendoza', UserRole.CAPTAIN),
  makeProfile(6, 'mock-admin-brgyapp-com', 'admin@brgyapp.com', 'Elena', 'Cruz', UserRole.SYSTEM_ADMIN),
  makeProfile(7, 'mock-resident2-brgyapp-com', 'resident2@brgyapp.com', 'Carlos', 'Ramos', UserRole.RESIDENT),
  makeProfile(8, 'mock-resident3-brgyapp-com', 'resident3@brgyapp.com', 'Linda', 'Aquino', UserRole.RESIDENT),
  makeProfile(9, 'mock-resident4-brgyapp-com', 'resident4@brgyapp.com', 'Jose', 'Villanueva', UserRole.RESIDENT),
  makeProfile(10, 'mock-resident5-brgyapp-com', 'resident5@brgyapp.com', 'Rosa', 'Bautista', UserRole.RESIDENT),
];

// userId → Profile lookup
export const profilesByUserId = new Map<string, Profile>();
// profileId → Profile lookup
export const profilesById = new Map<string, Profile>();

for (const p of profilesList) {
  profilesByUserId.set(p.user_id, p);
  profilesById.set(p.id, p);
}

// role → userId mapping for quickSignIn
export const roleToUserId: Record<string, string> = {
  [UserRole.RESIDENT]: 'mock-resident-brgyapp-com',
  [UserRole.STAFF]: 'mock-staff-brgyapp-com',
  [UserRole.SECRETARY]: 'mock-secretary-brgyapp-com',
  [UserRole.TREASURER]: 'mock-treasurer-brgyapp-com',
  [UserRole.CAPTAIN]: 'mock-captain-brgyapp-com',
  [UserRole.SYSTEM_ADMIN]: 'mock-admin-brgyapp-com',
};

// ---------------------------------------------------------------------------
// Complaints (15)
// ---------------------------------------------------------------------------

const residentIds = ['profile-001', 'profile-007', 'profile-008', 'profile-009', 'profile-010'];
const categories = Object.values(ComplaintCategory);
const priorities = Object.values(ComplaintPriority);
const statuses: ComplaintStatus[] = [
  ComplaintStatus.SUBMITTED,
  ComplaintStatus.SUBMITTED,
  ComplaintStatus.UNDER_REVIEW,
  ComplaintStatus.UNDER_REVIEW,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
  ComplaintStatus.RESOLVED,
  ComplaintStatus.RESOLVED,
  ComplaintStatus.REJECTED,
  ComplaintStatus.SUBMITTED,
  ComplaintStatus.UNDER_REVIEW,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
];

function makeComplaint(n: number): Complaint {
  const status = statuses[n - 1] ?? ComplaintStatus.SUBMITTED;
  const complaint: Complaint = {
    id: uuid('complaint', n),
    barangay_id: MOCK_BARANGAY_ID,
    reference_number: `CMP-2026-${String(n).padStart(4, '0')}`,
    complainant_id: residentIds[(n - 1) % residentIds.length],
    respondent_name: `Respondent ${n}`,
    respondent_address: `${200 + n} Mabini St., San Antonio`,
    category: categories[(n - 1) % categories.length],
    description: `This is a detailed description for complaint #${n}. The resident reports an ongoing issue that requires barangay intervention and mediation.`,
    priority: priorities[(n - 1) % priorities.length],
    status,
    assigned_to: status !== ComplaintStatus.SUBMITTED ? 'profile-002' : undefined,
    resolved_at: status === ComplaintStatus.RESOLVED ? daysAgo(n) : undefined,
    resolution_notes: status === ComplaintStatus.RESOLVED ? `Resolved through mediation on complaint #${n}.` : undefined,
    created_at: daysAgo(60 - n * 3),
    updated_at: daysAgo(Math.max(0, 30 - n * 2)),
  };
  return complaint;
}

export const complaints = new Map<string, Complaint>();
for (let i = 1; i <= 15; i++) {
  const c = makeComplaint(i);
  complaints.set(c.id, c);
}

// ---------------------------------------------------------------------------
// Complaint Status History (30+)
// ---------------------------------------------------------------------------

export const complaintStatusHistory: ComplaintStatusHistory[] = [];
let histIdx = 0;

for (const [, c] of complaints) {
  // Initial submission
  histIdx++;
  complaintStatusHistory.push({
    id: uuid('csh', histIdx),
    complaint_id: c.id,
    from_status: null,
    to_status: ComplaintStatus.SUBMITTED,
    changed_by: c.complainant_id,
    notes: 'Complaint filed',
    created_at: c.created_at,
    updated_at: c.created_at,
  });

  if (c.status === ComplaintStatus.UNDER_REVIEW || c.status === ComplaintStatus.IN_PROGRESS || c.status === ComplaintStatus.RESOLVED) {
    histIdx++;
    complaintStatusHistory.push({
      id: uuid('csh', histIdx),
      complaint_id: c.id,
      from_status: ComplaintStatus.SUBMITTED,
      to_status: ComplaintStatus.UNDER_REVIEW,
      changed_by: 'profile-002',
      notes: 'Now reviewing the complaint',
      created_at: daysAgo(50),
      updated_at: daysAgo(50),
    });
  }

  if (c.status === ComplaintStatus.IN_PROGRESS || c.status === ComplaintStatus.RESOLVED) {
    histIdx++;
    complaintStatusHistory.push({
      id: uuid('csh', histIdx),
      complaint_id: c.id,
      from_status: ComplaintStatus.UNDER_REVIEW,
      to_status: ComplaintStatus.IN_PROGRESS,
      changed_by: 'profile-002',
      notes: 'Investigation started',
      created_at: daysAgo(40),
      updated_at: daysAgo(40),
    });
  }

  if (c.status === ComplaintStatus.RESOLVED) {
    histIdx++;
    complaintStatusHistory.push({
      id: uuid('csh', histIdx),
      complaint_id: c.id,
      from_status: ComplaintStatus.IN_PROGRESS,
      to_status: ComplaintStatus.RESOLVED,
      changed_by: 'profile-003',
      notes: 'Resolved via mediation',
      created_at: c.resolved_at ?? daysAgo(5),
      updated_at: c.resolved_at ?? daysAgo(5),
    });
  }

  if (c.status === ComplaintStatus.REJECTED) {
    histIdx++;
    complaintStatusHistory.push({
      id: uuid('csh', histIdx),
      complaint_id: c.id,
      from_status: ComplaintStatus.SUBMITTED,
      to_status: ComplaintStatus.REJECTED,
      changed_by: 'profile-003',
      notes: 'Insufficient evidence provided',
      created_at: daysAgo(45),
      updated_at: daysAgo(45),
    });
  }
}

// ---------------------------------------------------------------------------
// Complaint Comments (15)
// ---------------------------------------------------------------------------

export const complaintComments = new Map<string, ComplaintComment>();

const commentTemplates = [
  { content: 'I would like to follow up on this complaint.', isInternal: false },
  { content: 'Noted. We will schedule a visit.', isInternal: false },
  { content: 'Internal note: Need to verify respondent address.', isInternal: true },
  { content: 'Please provide additional details about the incident.', isInternal: false },
  { content: 'Internal note: Escalated to secretary for review.', isInternal: true },
];

const complaintIds = Array.from(complaints.keys());
for (let i = 1; i <= 15; i++) {
  const tmpl = commentTemplates[(i - 1) % commentTemplates.length];
  const complaintId = complaintIds[(i - 1) % complaintIds.length];
  const authorId = tmpl.isInternal ? 'profile-002' : residentIds[(i - 1) % residentIds.length];
  const comment: ComplaintComment = {
    id: uuid('cc', i),
    complaint_id: complaintId,
    author_id: authorId,
    content: `${tmpl.content} (Comment #${i})`,
    is_internal: tmpl.isInternal,
    created_at: daysAgo(30 - i),
    updated_at: daysAgo(30 - i),
  };
  complaintComments.set(comment.id, comment);
}

// ---------------------------------------------------------------------------
// Complaint Attachments (8)
// ---------------------------------------------------------------------------

export const complaintAttachments = new Map<string, ComplaintAttachment>();

for (let i = 1; i <= 8; i++) {
  const complaintId = complaintIds[(i - 1) % complaintIds.length];
  const att: ComplaintAttachment = {
    id: uuid('ca', i),
    complaint_id: complaintId,
    uploaded_by: residentIds[(i - 1) % residentIds.length],
    file_name: `evidence_${i}.jpg`,
    file_path: `${complaintId}/${Date.now()}_evidence_${i}.jpg`,
    mime_type: 'image/jpeg',
    file_size: 1024 * (100 + i * 50),
    created_at: daysAgo(25 - i),
    updated_at: daysAgo(25 - i),
  };
  complaintAttachments.set(att.id, att);
}

// ---------------------------------------------------------------------------
// Document Requests (15)
// ---------------------------------------------------------------------------

const docTypes = Object.values(DocumentType).filter((t) => t !== DocumentType.OTHER);
const docStatuses: DocumentRequestStatus[] = [
  DocumentRequestStatus.SUBMITTED,
  DocumentRequestStatus.SUBMITTED,
  DocumentRequestStatus.PROCESSING,
  DocumentRequestStatus.PROCESSING,
  DocumentRequestStatus.FOR_APPROVAL,
  DocumentRequestStatus.FOR_APPROVAL,
  DocumentRequestStatus.APPROVED,
  DocumentRequestStatus.APPROVED,
  DocumentRequestStatus.FOR_RELEASE,
  DocumentRequestStatus.RELEASED,
  DocumentRequestStatus.RELEASED,
  DocumentRequestStatus.REJECTED,
  DocumentRequestStatus.SUBMITTED,
  DocumentRequestStatus.PROCESSING,
  DocumentRequestStatus.RELEASED,
];

const paymentForStatus = (s: DocumentRequestStatus): PaymentStatus => {
  if (s === DocumentRequestStatus.FOR_RELEASE || s === DocumentRequestStatus.RELEASED) return PaymentStatus.PAID;
  if (s === DocumentRequestStatus.REJECTED) return PaymentStatus.PENDING;
  return PaymentStatus.PENDING;
};

export const documentRequests = new Map<string, DocumentRequest>();

for (let i = 1; i <= 15; i++) {
  const status = docStatuses[i - 1];
  const docType = docTypes[(i - 1) % docTypes.length];
  const doc: DocumentRequest = {
    id: uuid('doc', i),
    barangay_id: MOCK_BARANGAY_ID,
    reference_number: `DOC-2026-${String(i).padStart(4, '0')}`,
    requestor_id: residentIds[(i - 1) % residentIds.length],
    document_type: docType,
    form_data: { purpose_detail: `Need for ${docType.replace(/_/g, ' ')}` },
    purpose: `Application for ${docType.replace(/_/g, ' ')}`,
    status,
    payment_status: paymentForStatus(status),
    amount: 50 + (i % 4) * 25,
    or_number: status === DocumentRequestStatus.RELEASED ? `OR-${2026}-${String(i).padStart(4, '0')}` : undefined,
    processed_by: [DocumentRequestStatus.SUBMITTED].includes(status) ? undefined : 'profile-002',
    approved_by: [DocumentRequestStatus.SUBMITTED, DocumentRequestStatus.PROCESSING, DocumentRequestStatus.FOR_APPROVAL].includes(status)
      ? undefined
      : 'profile-005',
    released_at: status === DocumentRequestStatus.RELEASED ? daysAgo(i) : undefined,
    rejection_reason: status === DocumentRequestStatus.REJECTED ? 'Incomplete requirements' : undefined,
    created_at: daysAgo(55 - i * 3),
    updated_at: daysAgo(Math.max(0, 25 - i * 2)),
  };
  documentRequests.set(doc.id, doc);
}

// ---------------------------------------------------------------------------
// Document Status History (30+)
// ---------------------------------------------------------------------------

export const documentStatusHistory: DocumentRequestStatusHistory[] = [];
let docHistIdx = 0;

for (const [, d] of documentRequests) {
  const chain: DocumentRequestStatus[] = [DocumentRequestStatus.SUBMITTED];

  if (d.status !== DocumentRequestStatus.SUBMITTED && d.status !== DocumentRequestStatus.REJECTED) {
    chain.push(DocumentRequestStatus.PROCESSING);
  }
  if ([DocumentRequestStatus.FOR_APPROVAL, DocumentRequestStatus.APPROVED, DocumentRequestStatus.FOR_RELEASE, DocumentRequestStatus.RELEASED].includes(d.status)) {
    chain.push(DocumentRequestStatus.FOR_APPROVAL);
  }
  if ([DocumentRequestStatus.APPROVED, DocumentRequestStatus.FOR_RELEASE, DocumentRequestStatus.RELEASED].includes(d.status)) {
    chain.push(DocumentRequestStatus.APPROVED);
  }
  if ([DocumentRequestStatus.FOR_RELEASE, DocumentRequestStatus.RELEASED].includes(d.status)) {
    chain.push(DocumentRequestStatus.FOR_RELEASE);
  }
  if (d.status === DocumentRequestStatus.RELEASED) {
    chain.push(DocumentRequestStatus.RELEASED);
  }
  if (d.status === DocumentRequestStatus.REJECTED) {
    chain.push(DocumentRequestStatus.REJECTED);
  }

  for (let j = 0; j < chain.length; j++) {
    docHistIdx++;
    documentStatusHistory.push({
      id: uuid('dsh', docHistIdx),
      document_request_id: d.id,
      from_status: j === 0 ? null : chain[j - 1],
      to_status: chain[j],
      changed_by: j === 0 ? d.requestor_id : 'profile-002',
      notes: j === 0 ? 'Request submitted' : `Status changed to ${chain[j]}`,
      created_at: daysAgo(50 - j * 5),
      updated_at: daysAgo(50 - j * 5),
    });
  }
}

// ---------------------------------------------------------------------------
// Document Attachments
// ---------------------------------------------------------------------------

export const documentAttachments = new Map<string, DocumentRequestAttachment>();

// ---------------------------------------------------------------------------
// Fee Schedule (6 entries)
// ---------------------------------------------------------------------------

export const feeSchedule = new Map<string, DocumentFeeSchedule>();

const feeEntries: [DocumentType, number, string][] = [
  [DocumentType.BARANGAY_CLEARANCE, 50, 'Standard barangay clearance fee'],
  [DocumentType.BARANGAY_ID, 100, 'Barangay ID processing fee'],
  [DocumentType.CERTIFICATE_OF_RESIDENCY, 75, 'Certificate of residency fee'],
  [DocumentType.CERTIFICATE_OF_INDIGENCY, 0, 'Free for indigent residents'],
  [DocumentType.BUSINESS_CLEARANCE, 200, 'Business clearance processing fee'],
  [DocumentType.CEDULA, 50, 'Community tax certificate fee'],
];

for (let i = 0; i < feeEntries.length; i++) {
  const [docType, fee, desc] = feeEntries[i];
  const entry: DocumentFeeSchedule = {
    id: uuid('fee', i + 1),
    barangay_id: MOCK_BARANGAY_ID,
    document_type: docType,
    fee,
    description: desc,
    is_active: true,
    created_at: daysAgo(90),
    updated_at: now,
  };
  feeSchedule.set(entry.id, entry);
}

// ---------------------------------------------------------------------------
// Hearings (8)
// ---------------------------------------------------------------------------

export const hearings = new Map<string, Hearing>();

const hearingStatuses: HearingStatus[] = [
  HearingStatus.SCHEDULED,
  HearingStatus.SCHEDULED,
  HearingStatus.SCHEDULED,
  HearingStatus.IN_PROGRESS,
  HearingStatus.COMPLETED,
  HearingStatus.COMPLETED,
  HearingStatus.COMPLETED,
  HearingStatus.CANCELLED,
];

for (let i = 1; i <= 8; i++) {
  const complaintId = complaintIds[(i - 1) % complaintIds.length];
  const status = hearingStatuses[i - 1];
  const isUpcoming = status === HearingStatus.SCHEDULED;
  const hearing: Hearing = {
    id: uuid('hearing', i),
    complaint_id: complaintId,
    barangay_id: MOCK_BARANGAY_ID,
    scheduled_date: isUpcoming ? daysAgo(-7 - i) : daysAgo(20 - i * 2), // future for scheduled
    scheduled_time: `${9 + (i % 4)}:00`,
    venue: i % 2 === 0 ? 'Barangay Hall - Room A' : 'Barangay Hall - Main Hall',
    status,
    presiding_officer_id: 'profile-005', // captain
    notes: `Hearing #${i} for complaint ${complaintId}`,
    minutes: status === HearingStatus.COMPLETED ? `Minutes of hearing #${i}: Both parties were present. Mediation was conducted.` : undefined,
    outcome: status === HearingStatus.COMPLETED ? 'Agreement reached between parties' : undefined,
    created_at: daysAgo(30 - i),
    updated_at: daysAgo(15 - i),
  };
  hearings.set(hearing.id, hearing);
}

// ---------------------------------------------------------------------------
// Hearing Attendees (20)
// ---------------------------------------------------------------------------

export const hearingAttendees = new Map<string, HearingAttendee>();

const hearingIds = Array.from(hearings.keys());
let attIdx = 0;

for (let i = 0; i < hearingIds.length; i++) {
  const hearingId = hearingIds[i];
  const hearing = hearings.get(hearingId)!;
  const complaint = complaints.get(hearing.complaint_id);
  const isComplete = hearing.status === HearingStatus.COMPLETED;

  // Complainant
  attIdx++;
  hearingAttendees.set(uuid('ha', attIdx), {
    id: uuid('ha', attIdx),
    hearing_id: hearingId,
    profile_id: complaint?.complainant_id ?? 'profile-001',
    role: 'complainant',
    is_present: isComplete,
    remarks: isComplete ? 'Present and testified' : undefined,
    created_at: hearing.created_at,
    updated_at: hearing.updated_at,
  });

  // Respondent (using a different resident)
  attIdx++;
  hearingAttendees.set(uuid('ha', attIdx), {
    id: uuid('ha', attIdx),
    hearing_id: hearingId,
    profile_id: residentIds[(i + 1) % residentIds.length],
    role: 'respondent',
    is_present: isComplete ? i % 3 !== 0 : false,
    remarks: isComplete && i % 3 === 0 ? 'Did not appear' : undefined,
    created_at: hearing.created_at,
    updated_at: hearing.updated_at,
  });

  // Mediator (only some hearings)
  if (i % 2 === 0) {
    attIdx++;
    hearingAttendees.set(uuid('ha', attIdx), {
      id: uuid('ha', attIdx),
      hearing_id: hearingId,
      profile_id: 'profile-003', // secretary
      role: 'mediator',
      is_present: isComplete,
      created_at: hearing.created_at,
      updated_at: hearing.updated_at,
    });
  }
}

// ---------------------------------------------------------------------------
// Notifications (20)
// ---------------------------------------------------------------------------

export const notifications = new Map<string, Notification>();

const notifTypes = Object.values(NotificationType);
const allUserIds = profilesList.map((p) => p.user_id);

for (let i = 1; i <= 20; i++) {
  const userId = allUserIds[(i - 1) % allUserIds.length];
  const type = notifTypes[(i - 1) % notifTypes.length];
  const notif: Notification = {
    id: uuid('notif', i),
    user_id: userId,
    type,
    title: `${type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} #${i}`,
    body: `This is notification #${i}. Tap to view details about this ${type.replace(/_/g, ' ')}.`,
    data: { reference_id: uuid('ref', i) },
    is_read: i > 12, // first 12 are unread
    read_at: i > 12 ? daysAgo(1) : undefined,
    created_at: daysAgo(20 - i),
    updated_at: daysAgo(20 - i),
  };
  notifications.set(notif.id, notif);
}

// ---------------------------------------------------------------------------
// Announcements (5)
// ---------------------------------------------------------------------------

export const announcements = new Map<string, Announcement>();

const announcementData: [string, string, boolean][] = [
  ['Community Clean-up Drive', 'Join us this Saturday for a community-wide clean-up drive. Meeting point: Barangay Hall at 7:00 AM.', true],
  ['COVID-19 Vaccination Schedule', 'Free vaccination for residents aged 12 and above. Bring valid ID and registration form.', true],
  ['Barangay Assembly Notice', 'Annual barangay assembly will be held on March 15 at the covered court. All residents are encouraged to attend.', true],
  ['Water Interruption Advisory', 'Scheduled water interruption on Feb 25-26 due to maintenance. Please store water in advance.', true],
  ['Youth Sports Program', 'Registration for the summer youth sports program is now open. Visit the barangay hall for details.', false],
];

for (let i = 0; i < announcementData.length; i++) {
  const [title, content, isPublished] = announcementData[i];
  const ann: Announcement = {
    id: uuid('ann', i + 1),
    barangay_id: MOCK_BARANGAY_ID,
    author_id: 'profile-005',
    title,
    content,
    is_pinned: i === 0,
    is_published: isPublished,
    published_at: isPublished ? daysAgo(10 - i) : undefined,
    created_at: daysAgo(15 - i),
    updated_at: daysAgo(10 - i),
  };
  announcements.set(ann.id, ann);
}

// ---------------------------------------------------------------------------
// Audit Logs (25)
// ---------------------------------------------------------------------------

export const auditLogs: AuditLog[] = [];

const actions = ['create', 'update', 'status_change', 'assign', 'verify', 'login'];
const resourceTypes = ['complaint', 'document_request', 'profile', 'hearing', 'announcement'];
const actorIds = ['profile-002', 'profile-003', 'profile-005', 'profile-006'];

for (let i = 1; i <= 25; i++) {
  auditLogs.push({
    id: uuid('audit', i),
    barangay_id: MOCK_BARANGAY_ID,
    actor_id: actorIds[(i - 1) % actorIds.length],
    action: actions[(i - 1) % actions.length],
    resource_type: resourceTypes[(i - 1) % resourceTypes.length],
    resource_id: uuid('resource', i),
    old_values: i % 3 === 0 ? { status: 'submitted' } : undefined,
    new_values: i % 3 === 0 ? { status: 'under_review' } : undefined,
    created_at: daysAgo(25 - i),
    updated_at: daysAgo(25 - i),
  });
}
