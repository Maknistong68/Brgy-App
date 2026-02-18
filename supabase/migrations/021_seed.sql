-- Seed RBAC permissions
INSERT INTO role_permissions (role, module, can_create, can_read, can_update, can_delete, can_approve, can_assign, can_export) VALUES
-- Resident
('resident', 'complaints', true, true, false, false, false, false, false),
('resident', 'documents', true, true, false, false, false, false, false),
('resident', 'dashboard', false, true, false, false, false, false, false),
-- Staff
('staff', 'complaints', true, true, true, true, false, false, false),
('staff', 'documents', true, true, true, true, false, false, false),
('staff', 'dashboard', false, true, false, false, false, false, false),
('staff', 'users', false, true, false, false, false, false, false),
('staff', 'reports', false, true, false, false, false, false, false),
-- Secretary
('secretary', 'complaints', true, true, true, true, true, true, false),
('secretary', 'documents', true, true, true, true, true, true, false),
('secretary', 'dashboard', false, true, false, false, false, false, false),
('secretary', 'users', false, true, true, false, false, false, false),
('secretary', 'settings', false, true, false, false, false, false, false),
('secretary', 'announcements', true, true, true, true, false, false, false),
('secretary', 'reports', false, true, false, false, false, false, true),
-- Treasurer
('treasurer', 'documents', true, true, true, true, true, true, false),
('treasurer', 'dashboard', false, true, false, false, false, false, false),
('treasurer', 'settings', false, true, false, false, false, false, false),
('treasurer', 'reports', false, true, false, false, false, false, true),
('treasurer', 'complaints', false, true, false, false, false, false, false),
-- Captain
('captain', 'complaints', true, true, true, true, true, true, false),
('captain', 'documents', true, true, true, true, true, true, false),
('captain', 'dashboard', false, true, false, false, false, false, false),
('captain', 'users', false, true, true, false, false, false, false),
('captain', 'settings', false, true, true, false, false, false, false),
('captain', 'announcements', true, true, true, true, false, false, false),
('captain', 'reports', false, true, false, false, false, false, true),
-- System Admin
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

-- Seed fee schedule for default barangay
INSERT INTO document_fee_schedule (barangay_id, document_type, fee, description) VALUES
('00000000-0000-0000-0000-000000000001', 'barangay_clearance', 50.00, 'Barangay Clearance Fee'),
('00000000-0000-0000-0000-000000000001', 'barangay_id', 100.00, 'Barangay ID Fee'),
('00000000-0000-0000-0000-000000000001', 'certificate_of_residency', 50.00, 'Certificate of Residency Fee'),
('00000000-0000-0000-0000-000000000001', 'certificate_of_indigency', 0.00, 'Free of charge'),
('00000000-0000-0000-0000-000000000001', 'business_clearance', 200.00, 'Business Clearance Fee'),
('00000000-0000-0000-0000-000000000001', 'cedula', 50.00, 'Community Tax Certificate Fee');
