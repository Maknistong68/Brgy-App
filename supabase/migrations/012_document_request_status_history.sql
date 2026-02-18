CREATE TABLE document_request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_request_id UUID NOT NULL REFERENCES document_requests(id) ON DELETE CASCADE,
  from_status document_request_status,
  to_status document_request_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doc_history_request ON document_request_status_history(document_request_id);
