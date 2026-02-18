export const APP_NAME = 'Brgy App';
export const APP_VERSION = '1.0.0';

export const ROLE_HIERARCHY: Record<string, number> = {
  resident: 0,
  staff: 1,
  secretary: 2,
  treasurer: 2,
  captain: 3,
  system_admin: 4,
};

export const COMPLAINT_STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ['under_review', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};

export const DOCUMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ['processing', 'rejected'],
  processing: ['for_approval', 'rejected'],
  for_approval: ['approved', 'rejected'],
  approved: ['for_release'],
  for_release: ['released'],
  released: [],
  rejected: [],
};

export const PAGINATION = { DEFAULT_PAGE_SIZE: 20, MAX_PAGE_SIZE: 100 };
export const SYNC = { DEBOUNCE_MS: 5000, PERIODIC_INTERVAL_MS: 300000 };
export const STORAGE_BUCKETS = { AVATARS: 'avatars', COMPLAINT_ATTACHMENTS: 'complaint-attachments', DOCUMENT_ATTACHMENTS: 'document-attachments' };
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  barangay_id: 'Barangay ID',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_clearance: 'Business Clearance',
  cedula: 'Community Tax Certificate (Cedula)',
  other: 'Other',
};
export const COMPLAINT_CATEGORY_LABELS: Record<string, string> = {
  noise: 'Noise Complaint',
  property_dispute: 'Property Dispute',
  domestic: 'Domestic Issue',
  theft: 'Theft',
  vandalism: 'Vandalism',
  public_disturbance: 'Public Disturbance',
  boundary_dispute: 'Boundary Dispute',
  financial_dispute: 'Financial Dispute',
  other: 'Other',
};
