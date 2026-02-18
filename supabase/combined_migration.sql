-- ============================================
-- Migration: 001_enums.sql
-- ============================================
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

-- ============================================
-- Migration: 002_barangays.sql
-- ============================================
CREATE TABLE barangays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  region TEXT,
  zip_code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_barangays_name ON barangays(name);

-- ============================================
-- Migration: 003_profiles.sql
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barangay_id UUID REFERENCES barangays(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  suffix TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'resident',
  avatar_url TEXT,
  address TEXT,
  purok TEXT,
  date_of_birth DATE,
  gender gender,
  civil_status civil_status,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_barangay_id ON profiles(barangay_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- Migration: 004_role_permissions.sql
-- ============================================
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  module TEXT NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  can_assign BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, module)
);

-- ============================================
-- Migration: 005_complaints.sql
-- ============================================
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay_id UUID NOT NULL REFERENCES barangays(id),
  reference_number TEXT NOT NULL UNIQUE,
  complainant_id UUID NOT NULL REFERENCES profiles(id),
  respondent_name TEXT NOT NULL,
  respondent_address TEXT,
  respondent_phone TEXT,
  category complaint_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  priority complaint_priority NOT NULL DEFAULT 'medium',
  status complaint_status NOT NULL DEFAULT 'submitted',
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaints_barangay ON complaints(barangay_id);
CREATE INDEX idx_complaints_complainant ON complaints(complainant_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_ref ON complaints(reference_number);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_to);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);

-- ============================================
-- Migration: 006_complaint_status_history.sql
-- ============================================
CREATE TABLE complaint_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  from_status complaint_status,
  to_status complaint_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_history_complaint ON complaint_status_history(complaint_id);

-- ============================================
-- Migration: 007_complaint_comments.sql
-- ============================================
CREATE TABLE complaint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_comments_complaint ON complaint_comments(complaint_id);

-- ============================================
-- Migration: 008_complaint_attachments.sql
-- ============================================
CREATE TABLE complaint_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_attachments_complaint ON complaint_attachments(complaint_id);

-- ============================================
-- Migration: 009_hearings.sql
-- ============================================
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

-- ============================================
-- Migration: 010_hearing_attendees.sql
-- ============================================
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

-- ============================================
-- Migration: 011_document_requests.sql
-- ============================================
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

-- ============================================
-- Migration: 012_document_request_status_history.sql
-- ============================================
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

-- ============================================
-- Migration: 013_document_request_attachments.sql
-- ============================================
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

-- ============================================
-- Migration: 014_document_fee_schedule.sql
-- ============================================
CREATE TABLE document_fee_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay_id UUID NOT NULL REFERENCES barangays(id),
  document_type document_type NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(barangay_id, document_type)
);

-- ============================================
-- Migration: 015_notifications.sql
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- Migration: 016_audit_logs.sql
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- Migration: 017_announcements.sql
-- ============================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay_id UUID NOT NULL REFERENCES barangays(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_announcements_barangay ON announcements(barangay_id);
CREATE INDEX idx_announcements_published ON announcements(is_published, published_at DESC);

-- ============================================
-- Migration: 018_functions.sql
-- (auth schema functions moved to public schema)
-- ============================================

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate reference number function
CREATE OR REPLACE FUNCTION generate_reference_number(prefix TEXT, table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
  ref TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');

  IF table_name = 'complaints' THEN
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(reference_number FROM '\d+$') AS INTEGER)
    ), 0) + 1 INTO seq_num
    FROM complaints
    WHERE reference_number LIKE prefix || '-' || year_str || '-%';
  ELSE
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(reference_number FROM '\d+$') AS INTEGER)
    ), 0) + 1 INTO seq_num
    FROM document_requests
    WHERE reference_number LIKE prefix || '-' || year_str || '-%';
  END IF;

  ref := prefix || '-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Helper: get current user's role (PUBLIC schema)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's barangay_id (PUBLIC schema)
CREATE OR REPLACE FUNCTION get_user_barangay_id()
RETURNS UUID AS $$
  SELECT barangay_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's profile id (PUBLIC schema)
CREATE OR REPLACE FUNCTION get_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Role hierarchy check
CREATE OR REPLACE FUNCTION is_role_at_least(check_role user_role, minimum_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  role_levels CONSTANT INTEGER[] := ARRAY[0, 1, 2, 2, 3, 4];
  role_names CONSTANT user_role[] := ARRAY['resident', 'staff', 'secretary', 'treasurer', 'captain', 'system_admin']::user_role[];
  check_level INTEGER;
  min_level INTEGER;
BEGIN
  SELECT role_levels[array_position(role_names, check_role)] INTO check_level;
  SELECT role_levels[array_position(role_names, minimum_role)] INTO min_level;
  RETURN check_level >= min_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'resident'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-generate complaint reference number
CREATE OR REPLACE FUNCTION generate_complaint_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_reference_number('COMP', 'complaints');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate document request reference number
CREATE OR REPLACE FUNCTION generate_document_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_reference_number('DOC', 'document_requests');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration: 019_triggers.sql
-- ============================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON barangays FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON role_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON complaint_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON hearings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON document_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON document_fee_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-generate reference numbers
CREATE TRIGGER set_complaint_ref BEFORE INSERT ON complaints FOR EACH ROW EXECUTE FUNCTION generate_complaint_ref();
CREATE TRIGGER set_document_ref BEFORE INSERT ON document_requests FOR EACH ROW EXECUTE FUNCTION generate_document_ref();

-- ============================================
-- Migration: 020_rls.sql
-- (using public schema functions instead of auth schema)
-- ============================================
ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearing_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_fee_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- BARANGAYS
CREATE POLICY "barangays_select" ON barangays FOR SELECT TO authenticated USING (true);
CREATE POLICY "barangays_admin" ON barangays FOR ALL TO authenticated USING (is_role_at_least(get_user_role(), 'system_admin'::user_role));

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR barangay_id = get_user_barangay_id());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL TO authenticated
  USING (is_role_at_least(get_user_role(), 'system_admin'::user_role));

-- ROLE_PERMISSIONS
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_admin" ON role_permissions FOR ALL TO authenticated USING (is_role_at_least(get_user_role(), 'system_admin'::user_role));

-- COMPLAINTS
CREATE POLICY "complaints_select_own" ON complaints FOR SELECT TO authenticated
  USING (
    complainant_id = get_user_profile_id()
    OR (barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role))
  );
CREATE POLICY "complaints_insert" ON complaints FOR INSERT TO authenticated
  WITH CHECK (complainant_id = get_user_profile_id());
CREATE POLICY "complaints_update_own" ON complaints FOR UPDATE TO authenticated
  USING (
    (complainant_id = get_user_profile_id() AND status = 'submitted')
    OR (barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role))
  );
CREATE POLICY "complaints_delete_admin" ON complaints FOR DELETE TO authenticated
  USING (is_role_at_least(get_user_role(), 'secretary'::user_role) AND barangay_id = get_user_barangay_id());

-- COMPLAINT STATUS HISTORY
CREATE POLICY "complaint_history_select" ON complaint_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM complaints c WHERE c.id = complaint_id
    AND (c.complainant_id = get_user_profile_id() OR (c.barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "complaint_history_insert" ON complaint_status_history FOR INSERT TO authenticated
  WITH CHECK (is_role_at_least(get_user_role(), 'staff'::user_role));

-- COMPLAINT COMMENTS
CREATE POLICY "complaint_comments_select" ON complaint_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM complaints c WHERE c.id = complaint_id
    AND (c.complainant_id = get_user_profile_id() OR (c.barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role)))
  ) AND (NOT is_internal OR is_role_at_least(get_user_role(), 'staff'::user_role)));
CREATE POLICY "complaint_comments_insert" ON complaint_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = get_user_profile_id());

-- COMPLAINT ATTACHMENTS
CREATE POLICY "complaint_attachments_select" ON complaint_attachments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM complaints c WHERE c.id = complaint_id
    AND (c.complainant_id = get_user_profile_id() OR (c.barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "complaint_attachments_insert" ON complaint_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = get_user_profile_id());

-- HEARINGS
CREATE POLICY "hearings_select" ON hearings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM complaints c WHERE c.id = complaint_id
    AND (c.complainant_id = get_user_profile_id() OR (c.barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "hearings_manage" ON hearings FOR ALL TO authenticated
  USING (is_role_at_least(get_user_role(), 'secretary'::user_role));

-- HEARING ATTENDEES
CREATE POLICY "hearing_attendees_select" ON hearing_attendees FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM hearings h WHERE h.id = hearing_id));
CREATE POLICY "hearing_attendees_manage" ON hearing_attendees FOR ALL TO authenticated
  USING (is_role_at_least(get_user_role(), 'secretary'::user_role));

-- DOCUMENT REQUESTS
CREATE POLICY "doc_requests_select" ON document_requests FOR SELECT TO authenticated
  USING (
    requestor_id = get_user_profile_id()
    OR (barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role))
  );
CREATE POLICY "doc_requests_insert" ON document_requests FOR INSERT TO authenticated
  WITH CHECK (requestor_id = get_user_profile_id());
CREATE POLICY "doc_requests_update" ON document_requests FOR UPDATE TO authenticated
  USING (
    (requestor_id = get_user_profile_id() AND status = 'submitted')
    OR (barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role))
  );

-- DOCUMENT REQUEST STATUS HISTORY
CREATE POLICY "doc_history_select" ON document_request_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM document_requests d WHERE d.id = document_request_id
    AND (d.requestor_id = get_user_profile_id() OR (d.barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "doc_history_insert" ON document_request_status_history FOR INSERT TO authenticated
  WITH CHECK (is_role_at_least(get_user_role(), 'staff'::user_role));

-- DOCUMENT REQUEST ATTACHMENTS
CREATE POLICY "doc_attachments_select" ON document_request_attachments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM document_requests d WHERE d.id = document_request_id
    AND (d.requestor_id = get_user_profile_id() OR (d.barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "doc_attachments_insert" ON document_request_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = get_user_profile_id());

-- DOCUMENT FEE SCHEDULE
CREATE POLICY "fee_schedule_select" ON document_fee_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "fee_schedule_manage" ON document_fee_schedule FOR ALL TO authenticated
  USING (is_role_at_least(get_user_role(), 'secretary'::user_role));

-- NOTIFICATIONS
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (user_id = get_user_profile_id());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated
  USING (user_id = get_user_profile_id());

-- AUDIT LOGS
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT TO authenticated
  USING (is_role_at_least(get_user_role(), 'secretary'::user_role));
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ANNOUNCEMENTS
CREATE POLICY "announcements_select" ON announcements FOR SELECT TO authenticated
  USING (
    (is_published = true AND (expires_at IS NULL OR expires_at > now()))
    OR (barangay_id = get_user_barangay_id() AND is_role_at_least(get_user_role(), 'staff'::user_role))
  );
CREATE POLICY "announcements_manage" ON announcements FOR ALL TO authenticated
  USING (is_role_at_least(get_user_role(), 'secretary'::user_role) AND barangay_id = get_user_barangay_id());

-- ============================================
-- Migration: 021_seed.sql
-- ============================================
INSERT INTO role_permissions (role, module, can_create, can_read, can_update, can_delete, can_approve, can_assign, can_export) VALUES
('resident', 'complaints', true, true, false, false, false, false, false),
('resident', 'documents', true, true, false, false, false, false, false),
('resident', 'dashboard', false, true, false, false, false, false, false),
('staff', 'complaints', true, true, true, true, false, false, false),
('staff', 'documents', true, true, true, true, false, false, false),
('staff', 'dashboard', false, true, false, false, false, false, false),
('staff', 'users', false, true, false, false, false, false, false),
('staff', 'reports', false, true, false, false, false, false, false),
('secretary', 'complaints', true, true, true, true, true, true, false),
('secretary', 'documents', true, true, true, true, true, true, false),
('secretary', 'dashboard', false, true, false, false, false, false, false),
('secretary', 'users', false, true, true, false, false, false, false),
('secretary', 'settings', false, true, false, false, false, false, false),
('secretary', 'announcements', true, true, true, true, false, false, false),
('secretary', 'reports', false, true, false, false, false, false, true),
('treasurer', 'documents', true, true, true, true, true, true, false),
('treasurer', 'dashboard', false, true, false, false, false, false, false),
('treasurer', 'settings', false, true, false, false, false, false, false),
('treasurer', 'reports', false, true, false, false, false, false, true),
('treasurer', 'complaints', false, true, false, false, false, false, false),
('captain', 'complaints', true, true, true, true, true, true, false),
('captain', 'documents', true, true, true, true, true, true, false),
('captain', 'dashboard', false, true, false, false, false, false, false),
('captain', 'users', false, true, true, false, false, false, false),
('captain', 'settings', false, true, true, false, false, false, false),
('captain', 'announcements', true, true, true, true, false, false, false),
('captain', 'reports', false, true, false, false, false, false, true),
('system_admin', 'complaints', true, true, true, true, true, true, false),
('system_admin', 'documents', true, true, true, true, true, true, false),
('system_admin', 'dashboard', false, true, false, false, false, false, false),
('system_admin', 'users', true, true, true, true, false, false, false),
('system_admin', 'settings', true, true, true, true, false, false, false),
('system_admin', 'announcements', true, true, true, true, false, false, false),
('system_admin', 'reports', false, true, false, false, false, false, true);

-- Seed a default barangay
INSERT INTO barangays (id, name, city, province, region) VALUES
('00000000-0000-0000-0000-000000000001', 'Sample Barangay', 'Sample City', 'Sample Province', 'NCR');

-- Seed fee schedule
INSERT INTO document_fee_schedule (barangay_id, document_type, fee, description) VALUES
('00000000-0000-0000-0000-000000000001', 'barangay_clearance', 50.00, 'Barangay Clearance Fee'),
('00000000-0000-0000-0000-000000000001', 'barangay_id', 100.00, 'Barangay ID Fee'),
('00000000-0000-0000-0000-000000000001', 'certificate_of_residency', 50.00, 'Certificate of Residency Fee'),
('00000000-0000-0000-0000-000000000001', 'certificate_of_indigency', 0.00, 'Free of charge'),
('00000000-0000-0000-0000-000000000001', 'business_clearance', 200.00, 'Business Clearance Fee'),
('00000000-0000-0000-0000-000000000001', 'cedula', 50.00, 'Community Tax Certificate Fee');
