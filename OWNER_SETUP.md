# THE ARK — Owner Account Setup

## After Your First Login

1. Sign in at your deployment URL using your email (magic link)
2. Open Supabase Dashboard → SQL Editor → New Query
3. Paste and run:

```sql
-- THE ARK — Bootstrap Owner Account
-- Replace the email below with YOUR email address
-- Run this ONCE after your first sign-in

-- Step 1: Verify your user was created
SELECT id, email, created_at FROM auth.users
WHERE email = 'REPLACE_WITH_OWNER_EMAIL';

-- Step 2: Set owner role (replace email)
UPDATE profiles
SET role = 'owner', is_active = TRUE
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'REPLACE_WITH_OWNER_EMAIL'
  LIMIT 1
);

-- Step 3: Verify
SELECT u.email, p.role, p.is_active
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'REPLACE_WITH_OWNER_EMAIL';
-- Should show: your email | owner | TRUE
```

## If Your Profile Wasn't Auto-Created

This happens if the trigger ran before schema_beta.sql was applied:

```sql
-- Manual profile insert
INSERT INTO profiles (user_id, email, role, is_active)
SELECT id, email, 'owner', TRUE
FROM auth.users
WHERE email = 'REPLACE_WITH_OWNER_EMAIL'
ON CONFLICT (user_id) DO UPDATE SET role = 'owner', is_active = TRUE;
```

## Verify Admin Access

After running the SQL:
1. Refresh your app
2. Click **Admin** in the sidebar
3. You should see the Invite Manager, not a "Beta Disabled" screen

## Add More Admins

```sql
-- Promote a beta tester to admin
UPDATE profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);
```
