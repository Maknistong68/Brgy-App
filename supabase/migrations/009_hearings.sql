CREATE TABLE hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  hearing_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL DEFAULT 'Barangay Hall',
  presiding_officer UUID REFERENCES profiles(id),
  status hearing_status NOT NULL DEFAULT 'scheduled',
  agenda TEXT,
  minutes TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hearings_complaint ON hearings(complaint_id);
CREATE INDEX idx_hearings_date ON hearings(hearing_date);
