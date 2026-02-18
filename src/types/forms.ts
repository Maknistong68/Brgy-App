import {
  CivilStatus,
  ComplaintCategory,
  ComplaintPriority,
  DocumentType,
  Gender,
} from './enums';

// ---------------------------------------------------------------------------
// Auth Forms
// ---------------------------------------------------------------------------

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  phone?: string;
  address: string;
  purok?: string;
  date_of_birth: string;
  gender: Gender;
  civil_status: CivilStatus;
  barangay_id: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirm_password: string;
}

// ---------------------------------------------------------------------------
// Profile Form
// ---------------------------------------------------------------------------

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  phone?: string;
  address: string;
  purok?: string;
  date_of_birth?: string;
  gender?: Gender;
  civil_status?: CivilStatus;
  avatar_url?: string;
}

// ---------------------------------------------------------------------------
// Complaint Form
// ---------------------------------------------------------------------------

export interface ComplaintFormData {
  respondent_name: string;
  respondent_address?: string;
  category: ComplaintCategory;
  description: string;
  priority?: ComplaintPriority;
  attachments?: ComplaintAttachmentInput[];
}

export interface ComplaintAttachmentInput {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface ComplaintCommentFormData {
  content: string;
  is_internal?: boolean;
}

export interface ComplaintResolutionFormData {
  resolution_notes: string;
}

// ---------------------------------------------------------------------------
// Document Request Form
// ---------------------------------------------------------------------------

export interface DocumentRequestFormData {
  document_type: DocumentType;
  purpose: string;
  form_data: Record<string, any>;
  attachments?: DocumentAttachmentInput[];
}

export interface DocumentAttachmentInput {
  uri: string;
  name: string;
  type: string;
  size: number;
}

// ---------------------------------------------------------------------------
// Hearing Form
// ---------------------------------------------------------------------------

export interface HearingFormData {
  complaint_id: string;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  notes?: string;
  attendee_ids: string[];
}

// ---------------------------------------------------------------------------
// Announcement Form
// ---------------------------------------------------------------------------

export interface AnnouncementFormData {
  title: string;
  content: string;
  image_url?: string;
  is_pinned?: boolean;
  is_published?: boolean;
  expires_at?: string;
}

// ---------------------------------------------------------------------------
// Fee Schedule Form
// ---------------------------------------------------------------------------

export interface FeeScheduleFormData {
  document_type: DocumentType;
  fee: number;
  description?: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Search / Filter Forms
// ---------------------------------------------------------------------------

export interface ComplaintSearchFormData {
  search?: string;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface DocumentSearchFormData {
  search?: string;
  document_type?: DocumentType;
  status?: string;
  date_from?: string;
  date_to?: string;
}
