-- ============================================================================
-- 022: Barangay Join Code
-- Adds a unique 6-char alphanumeric join code to each barangay for onboarding.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Step 1: Add column as NULLABLE first (avoids calling function during ALTER)
-- --------------------------------------------------------------------------
ALTER TABLE barangays ADD COLUMN IF NOT EXISTS join_code TEXT;

-- --------------------------------------------------------------------------
-- Step 2: Backfill existing rows with random codes (inline, no table self-query)
-- --------------------------------------------------------------------------
UPDATE barangays
   SET join_code = (
     SELECT string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789',
       floor(random() * 30 + 1)::int, 1), '')
     FROM generate_series(1, 6)
   )
 WHERE join_code IS NULL;

-- --------------------------------------------------------------------------
-- Step 3: Add constraints after data is populated
-- --------------------------------------------------------------------------
ALTER TABLE barangays ALTER COLUMN join_code SET NOT NULL;
ALTER TABLE barangays ADD CONSTRAINT barangays_join_code_unique UNIQUE (join_code);

-- --------------------------------------------------------------------------
-- Step 4: Function for generating unique codes (used by DEFAULT + RPC)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_unique_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT;
  i      INT;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM barangays WHERE join_code = result);
  END LOOP;
  RETURN result;
END;
$$;

-- Set default for future inserts
ALTER TABLE barangays ALTER COLUMN join_code SET DEFAULT generate_unique_join_code();

-- --------------------------------------------------------------------------
-- Step 5: RPC for admin to regenerate their code
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION regenerate_join_code(p_barangay_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role
    FROM profiles
   WHERE user_id = auth.uid()
     AND barangay_id = p_barangay_id;

  IF caller_role IS NULL OR caller_role NOT IN ('secretary', 'captain', 'system_admin') THEN
    RAISE EXCEPTION 'Unauthorized: only secretary, captain, or system_admin can regenerate join codes';
  END IF;

  new_code := generate_unique_join_code();

  UPDATE barangays
     SET join_code   = new_code,
         updated_at  = now()
   WHERE id = p_barangay_id;

  RETURN new_code;
END;
$$;
