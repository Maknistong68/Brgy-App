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

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's barangay_id
CREATE OR REPLACE FUNCTION auth.user_barangay_id()
RETURNS UUID AS $$
  SELECT barangay_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's profile id
CREATE OR REPLACE FUNCTION auth.user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Role hierarchy check
CREATE OR REPLACE FUNCTION is_role_at_least(check_role user_role, minimum_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  role_levels CONSTANT INTEGER[] := ARRAY[0, 1, 2, 2, 3, 4]; -- resident, staff, secretary, treasurer, captain, system_admin
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
  INSERT INTO profiles (user_id, email, first_name, last_name, role)
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
