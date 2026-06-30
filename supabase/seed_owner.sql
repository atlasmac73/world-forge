-- ================================================================
-- THE ARK — First Owner Bootstrap
-- Run in Supabase SQL Editor AFTER your first signup
-- Replace 'your@email.com' with your actual email
-- Isaac Brandon Burdette, Sole Inventor
-- ================================================================

-- Step 1: Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Step 2: Set yourself as owner (replace the UUID below with your user ID from step 1)
UPDATE profiles
SET role = 'owner', is_active = TRUE
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your@email.com' LIMIT 1
);

-- Step 3: Verify
SELECT u.email, p.role, p.is_active
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'your@email.com';

-- ─── OR: If profile wasn't auto-created, insert it manually ──────────────────

-- INSERT INTO profiles (user_id, email, role, is_active)
-- SELECT id, email, 'owner', TRUE
-- FROM auth.users
-- WHERE email = 'your@email.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
