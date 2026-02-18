-- 024: Add soft-delete columns and text constraints

-- Soft-delete columns
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for filtering out archived records
CREATE INDEX IF NOT EXISTS idx_complaints_archived ON complaints(archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_doc_requests_archived ON document_requests(archived_at) WHERE archived_at IS NULL;

-- Text length constraints
ALTER TABLE complaints
  ADD CONSTRAINT chk_complaint_description_length CHECK (char_length(description) <= 5000);

ALTER TABLE complaints
  ADD CONSTRAINT chk_complaint_respondent_name_length CHECK (char_length(respondent_name) <= 200);

ALTER TABLE document_requests
  ADD CONSTRAINT chk_doc_purpose_length CHECK (char_length(purpose) <= 2000);

ALTER TABLE profiles
  ADD CONSTRAINT chk_profile_first_name_length CHECK (char_length(first_name) <= 100);

ALTER TABLE profiles
  ADD CONSTRAINT chk_profile_last_name_length CHECK (char_length(last_name) <= 100);

ALTER TABLE profiles
  ADD CONSTRAINT chk_profile_phone_format CHECK (
    phone IS NULL OR phone ~ '^\+?[0-9\s\-()]{7,20}$'
  );

ALTER TABLE notifications
  ADD CONSTRAINT chk_notification_title_length CHECK (char_length(title) <= 200);

ALTER TABLE notifications
  ADD CONSTRAINT chk_notification_body_length CHECK (char_length(body) <= 2000);
