CREATE TABLE hearing_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id UUID NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  role TEXT,
  attended BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hearing_attendees_hearing ON hearing_attendees(hearing_id);
