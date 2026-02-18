-- Enum Types
CREATE TYPE user_role AS ENUM ('resident', 'staff', 'secretary', 'treasurer', 'captain', 'system_admin');
CREATE TYPE complaint_status AS ENUM ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE complaint_category AS ENUM ('noise', 'property_dispute', 'domestic', 'theft', 'vandalism', 'public_disturbance', 'boundary_dispute', 'financial_dispute', 'other');
CREATE TYPE document_type AS ENUM ('barangay_clearance', 'barangay_id', 'certificate_of_residency', 'certificate_of_indigency', 'business_clearance', 'cedula', 'other');
CREATE TYPE document_request_status AS ENUM ('submitted', 'processing', 'for_approval', 'approved', 'for_release', 'released', 'rejected');
CREATE TYPE hearing_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'waived');
CREATE TYPE notification_type AS ENUM ('complaint_status', 'complaint_assigned', 'complaint_comment', 'document_status', 'hearing_scheduled', 'hearing_reminder', 'announcement', 'system');
CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE civil_status AS ENUM ('single', 'married', 'widowed', 'separated', 'divorced');
