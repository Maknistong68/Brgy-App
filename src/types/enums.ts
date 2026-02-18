export enum UserRole {
  RESIDENT = 'resident',
  STAFF = 'staff',
  SECRETARY = 'secretary',
  TREASURER = 'treasurer',
  CAPTAIN = 'captain',
  SYSTEM_ADMIN = 'system_admin',
}

export enum ComplaintStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ComplaintCategory {
  NOISE = 'noise',
  PROPERTY_DISPUTE = 'property_dispute',
  DOMESTIC = 'domestic',
  THEFT = 'theft',
  VANDALISM = 'vandalism',
  PUBLIC_DISTURBANCE = 'public_disturbance',
  BOUNDARY_DISPUTE = 'boundary_dispute',
  FINANCIAL_DISPUTE = 'financial_dispute',
  OTHER = 'other',
}

export enum DocumentType {
  BARANGAY_CLEARANCE = 'barangay_clearance',
  BARANGAY_ID = 'barangay_id',
  CERTIFICATE_OF_RESIDENCY = 'certificate_of_residency',
  CERTIFICATE_OF_INDIGENCY = 'certificate_of_indigency',
  BUSINESS_CLEARANCE = 'business_clearance',
  CEDULA = 'cedula',
  OTHER = 'other',
}

export enum DocumentRequestStatus {
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  FOR_APPROVAL = 'for_approval',
  APPROVED = 'approved',
  FOR_RELEASE = 'for_release',
  RELEASED = 'released',
  REJECTED = 'rejected',
}

export enum HearingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  WAIVED = 'waived',
}

export enum NotificationType {
  COMPLAINT_STATUS = 'complaint_status',
  COMPLAINT_ASSIGNED = 'complaint_assigned',
  COMPLAINT_COMMENT = 'complaint_comment',
  DOCUMENT_STATUS = 'document_status',
  HEARING_SCHEDULED = 'hearing_scheduled',
  HEARING_REMINDER = 'hearing_reminder',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum CivilStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  WIDOWED = 'widowed',
  SEPARATED = 'separated',
  DIVORCED = 'divorced',
}
