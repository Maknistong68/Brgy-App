-- Enable RLS on all tables
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

-- BARANGAYS: all authenticated users can read
CREATE POLICY "barangays_select" ON barangays FOR SELECT TO authenticated USING (true);
CREATE POLICY "barangays_admin" ON barangays FOR ALL TO authenticated USING (is_role_at_least(auth.user_role(), 'system_admin'::user_role));

-- PROFILES: users see own + same barangay; only admin changes roles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR barangay_id = auth.user_barangay_id());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL TO authenticated
  USING (is_role_at_least(auth.user_role(), 'system_admin'::user_role));

-- ROLE_PERMISSIONS: everyone can read; admin can modify
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_admin" ON role_permissions FOR ALL TO authenticated USING (is_role_at_least(auth.user_role(), 'system_admin'::user_role));

-- COMPLAINTS: residents see own; staff+ see all in barangay
CREATE POLICY "complaints_select_own" ON complaints FOR SELECT TO authenticated
  USING (
    complainant_id = auth.user_profile_id()
    OR (barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role))
  );
CREATE POLICY "complaints_insert" ON complaints FOR INSERT TO authenticated
  WITH CHECK (complainant_id = auth.user_profile_id());
CREATE POLICY "complaints_update_own" ON complaints FOR UPDATE TO authenticated
  USING (
    (complainant_id = auth.user_profile_id() AND status = 'submitted')
    OR (barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role))
  );
CREATE POLICY "complaints_delete_admin" ON complaints FOR DELETE TO authenticated
  USING (is_role_at_least(auth.user_role(), 'secretary'::user_role) AND barangay_id = auth.user_barangay_id());

-- COMPLAINT STATUS HISTORY
CREATE POLICY "complaint_history_select" ON complaint_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM complaints c WHERE c.id = complaint_id
    AND (c.complainant_id = auth.user_profile_id() OR (c.barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "complaint_history_insert" ON complaint_status_history FOR INSERT TO authenticated
  WITH CHECK (is_role_at_least(auth.user_role(), 'staff'::user_role));

-- COMPLAINT COMMENTS: internal comments hidden from residents
CREATE POLICY "complaint_comments_select" ON complaint_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM complaints c WHERE c.id = complaint_id
    AND (c.complainant_id = auth.user_profile_id() OR (c.barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role)))
  ) AND (NOT is_internal OR is_role_at_least(auth.user_role(), 'staff'::user_role)));
CREATE POLICY "complaint_comments_insert" ON complaint_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.user_profile_id());

-- COMPLAINT ATTACHMENTS
CREATE POLICY "complaint_attachments_select" ON complaint_attachments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM complaints c WHERE c.id = complaint_id
    AND (c.complainant_id = auth.user_profile_id() OR (c.barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "complaint_attachments_insert" ON complaint_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.user_profile_id());

-- HEARINGS: secretary+ can manage
CREATE POLICY "hearings_select" ON hearings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM complaints c WHERE c.id = complaint_id
    AND (c.complainant_id = auth.user_profile_id() OR (c.barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "hearings_manage" ON hearings FOR ALL TO authenticated
  USING (is_role_at_least(auth.user_role(), 'secretary'::user_role));

-- HEARING ATTENDEES
CREATE POLICY "hearing_attendees_select" ON hearing_attendees FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM hearings h WHERE h.id = hearing_id));
CREATE POLICY "hearing_attendees_manage" ON hearing_attendees FOR ALL TO authenticated
  USING (is_role_at_least(auth.user_role(), 'secretary'::user_role));

-- DOCUMENT REQUESTS
CREATE POLICY "doc_requests_select" ON document_requests FOR SELECT TO authenticated
  USING (
    requestor_id = auth.user_profile_id()
    OR (barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role))
  );
CREATE POLICY "doc_requests_insert" ON document_requests FOR INSERT TO authenticated
  WITH CHECK (requestor_id = auth.user_profile_id());
CREATE POLICY "doc_requests_update" ON document_requests FOR UPDATE TO authenticated
  USING (
    (requestor_id = auth.user_profile_id() AND status = 'submitted')
    OR (barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role))
  );

-- DOCUMENT REQUEST STATUS HISTORY
CREATE POLICY "doc_history_select" ON document_request_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM document_requests d WHERE d.id = document_request_id
    AND (d.requestor_id = auth.user_profile_id() OR (d.barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "doc_history_insert" ON document_request_status_history FOR INSERT TO authenticated
  WITH CHECK (is_role_at_least(auth.user_role(), 'staff'::user_role));

-- DOCUMENT REQUEST ATTACHMENTS
CREATE POLICY "doc_attachments_select" ON document_request_attachments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM document_requests d WHERE d.id = document_request_id
    AND (d.requestor_id = auth.user_profile_id() OR (d.barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role)))
  ));
CREATE POLICY "doc_attachments_insert" ON document_request_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.user_profile_id());

-- DOCUMENT FEE SCHEDULE
CREATE POLICY "fee_schedule_select" ON document_fee_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "fee_schedule_manage" ON document_fee_schedule FOR ALL TO authenticated
  USING (is_role_at_least(auth.user_role(), 'secretary'::user_role));

-- NOTIFICATIONS: users see only their own
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.user_profile_id());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.user_profile_id());

-- AUDIT LOGS: secretary+ only
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT TO authenticated
  USING (is_role_at_least(auth.user_role(), 'secretary'::user_role));
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ANNOUNCEMENTS
CREATE POLICY "announcements_select" ON announcements FOR SELECT TO authenticated
  USING (
    (is_published = true AND (expires_at IS NULL OR expires_at > now()))
    OR (barangay_id = auth.user_barangay_id() AND is_role_at_least(auth.user_role(), 'staff'::user_role))
  );
CREATE POLICY "announcements_manage" ON announcements FOR ALL TO authenticated
  USING (is_role_at_least(auth.user_role(), 'secretary'::user_role) AND barangay_id = auth.user_barangay_id());
