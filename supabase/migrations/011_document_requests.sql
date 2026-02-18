CREATE TABLE document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay_id UUID NOT NULL REFERENCES barangays(id),
  reference_number TEXT NOT NULL UNIQUE,
  requestor_id UUID NOT NULL REFERENCES profiles(id),
  document_type document_type NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  purpose TEXT NOT NULL,
  status document_request_status NOT NULL DEFAULT 'submitted',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2),
  processed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  released_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doc_requests_barangay ON document_requests(barangay_id);
CREATE INDEX idx_doc_requests_requestor ON document_requests(requestor_id);
CREATE INDEX idx_doc_requests_status ON document_requests(status);
CREATE INDEX idx_doc_requests_ref ON document_requests(reference_number);
CREATE INDEX idx_doc_requests_type ON document_requests(document_type);
CREATE INDEX idx_doc_requests_created ON document_requests(created_at DESC);
