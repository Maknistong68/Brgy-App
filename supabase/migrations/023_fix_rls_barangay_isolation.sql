-- 023: Fix barangay isolation and prevent self-role-change
-- Prevents users from:
-- 1. Changing their barangay_id once set (except setting it when NULL)
-- 2. Changing their own role

-- Drop the existing update-own policy
DROP POLICY IF EXISTS profiles_update_own ON profiles;

-- Re-create with guards:
-- - barangay_id can only be set when currently NULL (first join)
-- - role must remain unchanged (only admins via service key can change roles)
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    -- Prevent self-role-change: role must stay the same
    AND role = (SELECT p.role FROM profiles p WHERE p.id = profiles.id)
    -- Prevent barangay hopping: only allow setting barangay_id when currently NULL
    AND (
      barangay_id IS NULL
      OR barangay_id = (SELECT p.barangay_id FROM profiles p WHERE p.id = profiles.id)
    )
  );

-- Internal comments: restrict is_internal to staff+
DROP POLICY IF EXISTS complaint_comments_insert ON complaint_comments;

CREATE POLICY complaint_comments_insert ON complaint_comments
  FOR INSERT
  WITH CHECK (
    author_id = auth.user_profile_id()
    AND (
      NOT is_internal
      OR is_role_at_least(auth.user_role(), 'staff')
    )
  );
