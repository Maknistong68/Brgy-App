-- This file is run after migrations to seed initial data
-- Role permissions are seeded in migration 021_seed.sql
-- This file can be used for additional development seed data

-- Sample announcements for development
INSERT INTO announcements (barangay_id, title, content, author_id, is_published, published_at)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'Welcome to Brgy App',
  'Welcome to the Barangay App! This application helps streamline barangay services including complaint management and document requests.',
  p.id,
  true,
  now()
FROM profiles p
WHERE p.role = 'system_admin'
LIMIT 1;
