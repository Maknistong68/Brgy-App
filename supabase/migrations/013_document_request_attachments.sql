CREATE TABLE document_request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_request_id UUID NOT NULL REFERENCES document_requests(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doc_attachments_request ON document_request_attachments(document_request_id);
