import {
  UserRole,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
  DocumentType,
  DocumentRequestStatus,
  HearingStatus,
  PaymentStatus,
  NotificationType,
  Gender,
  CivilStatus,
} from './enums';

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

export interface BaseModel {
  id: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Barangay
// ---------------------------------------------------------------------------

export interface Barangay extends BaseModel {
  name: string;
  municipality: string;
  province: string;
  region: string;
  zip_code: string;
  join_code: string;
  logo_url?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  captain_id?: string;
  secretary_id?: string;
  treasurer_id?: string;
}

// ---------------------------------------------------------------------------
// Profile (extends Supabase auth.users)
// ---------------------------------------------------------------------------

export interface Profile extends BaseModel {
  user_id: string;
  barangay_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  address: string | null;
  purok: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  civil_status: CivilStatus | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
}

// ---------------------------------------------------------------------------
// Role Permission
// ---------------------------------------------------------------------------

export interface RolePermission extends BaseModel {
  role: UserRole;
  resource: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

// ---------------------------------------------------------------------------
// Complaint
// ---------------------------------------------------------------------------

export interface Complaint extends BaseModel {
  barangay_id: string;
  reference_number: string;
  complainant_id: string;
  respondent_name: string;
  respondent_address?: string;
  category: ComplaintCategory;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface ComplaintStatusHistory extends BaseModel {
  complaint_id: string;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus;
  changed_by: string;
  notes?: string;
}

export interface ComplaintComment extends BaseModel {
  complaint_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
}

export interface ComplaintAttachment extends BaseModel {
  complaint_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
}

// ---------------------------------------------------------------------------
// Hearing
// ---------------------------------------------------------------------------

export interface Hearing extends BaseModel {
  complaint_id: string;
  barangay_id: string;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  status: HearingStatus;
  presiding_officer_id: string;
  notes?: string;
  minutes?: string;
  outcome?: string;
}

export interface HearingAttendee extends BaseModel {
  hearing_id: string;
  profile_id: string;
  role: string;
  is_present: boolean;
  remarks?: string;
}

// ---------------------------------------------------------------------------
// Document Request
// ---------------------------------------------------------------------------

export interface DocumentRequest extends BaseModel {
  barangay_id: string;
  reference_number: string;
  requestor_id: string;
  document_type: DocumentType;
  form_data: Record<string, any>;
  purpose: string;
  status: DocumentRequestStatus;
  payment_status: PaymentStatus;
  amount?: number;
  or_number?: string;
  processed_by?: string;
  approved_by?: string;
  released_at?: string;
  rejection_reason?: string;
}

export interface DocumentRequestStatusHistory extends BaseModel {
  document_request_id: string;
  from_status: DocumentRequestStatus | null;
  to_status: DocumentRequestStatus;
  changed_by: string;
  notes?: string;
}

export interface DocumentRequestAttachment extends BaseModel {
  document_request_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
}

// ---------------------------------------------------------------------------
// Document Fee Schedule
// ---------------------------------------------------------------------------

export interface DocumentFeeSchedule extends BaseModel {
  barangay_id: string;
  document_type: DocumentType;
  fee: number;
  description?: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

export interface Notification extends BaseModel {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export interface AuditLog extends BaseModel {
  barangay_id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------

export interface Announcement extends BaseModel {
  barangay_id: string;
  author_id: string;
  title: string;
  content: string;
  image_url?: string;
  is_pinned: boolean;
  is_published: boolean;
  published_at?: string;
  expires_at?: string;
}

// ---------------------------------------------------------------------------
// Utility / Joined types (for common queries)
// ---------------------------------------------------------------------------

export interface ComplaintWithRelations extends Complaint {
  complainant?: Profile;
  assigned_staff?: Profile;
  comments?: ComplaintComment[];
  attachments?: ComplaintAttachment[];
  status_history?: ComplaintStatusHistory[];
  hearings?: Hearing[];
}

export interface DocumentRequestWithRelations extends DocumentRequest {
  requestor?: Profile;
  processor?: Profile;
  approver?: Profile;
  attachments?: DocumentRequestAttachment[];
  status_history?: DocumentRequestStatusHistory[];
}

export interface HearingWithRelations extends Hearing {
  complaint?: Complaint;
  presiding_officer?: Profile;
  attendees?: (HearingAttendee & { profile?: Profile })[];
}
