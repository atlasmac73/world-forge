# THE ARK — Admin Guide
**Isaac Brandon Burdette, Sole Inventor — Atlas Genesis Matrix LLC**

---

## Your Role: Owner

As the Owner, you have full access to everything. No one can remove your owner role — it's set via SQL, not through the app.

---

## How to Invite Friends & Family

1. Sign in at your deployment URL
2. Click **Admin** in the sidebar (or navigate to the admin portal)
3. In the **Invite Manager**, enter their email and select a role:
   - **Beta Tester** — full app access, can use portals
   - **Viewer** — read-only, can see dashboards
   - **Contractor** — contractor portal access
   - **Admin** — can invite others and manage the platform
4. Click **Create Invite** — the link is auto-copied to your clipboard
5. Send them the link. It expires in 7 days.
6. They visit the link, click Accept, get a magic link email, and sign in

---

## Managing Feature Flags

Feature flags live in the `feature_flags` table in Supabase.

**Via Supabase SQL Editor:**
```sql
-- Enable SMS
UPDATE feature_flags SET enabled = TRUE WHERE flag_key = 'SMS_ENABLED';

-- Enable billing
UPDATE feature_flags SET enabled = TRUE WHERE flag_key = 'BILLING_ENABLED';

-- Enable Living Graph
UPDATE feature_flags SET enabled = TRUE WHERE flag_key = 'PORTAL_LIVING_GRAPH';
```

**Default states:**
| Flag | Default | Notes |
|------|---------|-------|
| PORTAL_DEALS | ✅ ON | |
| PORTAL_CONTRACTORS | ✅ ON | |
| PORTAL_AGENT_LAB | ✅ ON | |
| AI_ENABLED | ✅ ON | Requires ANTHROPIC_API_KEY |
| PORTAL_LIVING_GRAPH | ⏸ OFF | Coming soon |
| PORTAL_WORLD_FORGE | ⏸ OFF | Coming soon |
| PORTAL_NASDROP | ⏸ OFF | Owner only — enable when ready |
| PORTAL_GENESIS | ⏸ OFF | Owner only |
| BILLING_ENABLED | ⏸ OFF | Enable after Stripe setup |
| SMS_ENABLED | ⏸ OFF | Enable after A2P 10DLC registration |
| CONNECTORS_ENABLED | ⏸ OFF | Coming soon |

---

## Viewing Audit Logs

All sensitive actions are logged to the `audit_logs` table.

```sql
-- See all recent actions
SELECT u.email, a.action, a.resource_type, a.created_at
FROM audit_logs a
LEFT JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC
LIMIT 50;

-- See who signed in recently
SELECT u.email, p.last_seen_at, p.role
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
ORDER BY p.last_seen_at DESC NULLS LAST;
```

---

## Viewing Beta Feedback

```sql
SELECT u.email, f.type, f.portal, f.message, f.rating, f.created_at
FROM beta_feedback f
LEFT JOIN auth.users u ON u.id = f.user_id
ORDER BY f.created_at DESC;
```

---

## Revoking a User's Access

```sql
-- Deactivate a user
UPDATE profiles SET is_active = FALSE
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'problem@user.com'
);
```

Note: This doesn't delete their Supabase auth account, just disables portal access (RBAC checks `is_active`).

---

## Before Going Public

Complete this before enabling sign-ups for anyone outside your invite list:

- [ ] Register Twilio A2P 10DLC (required for SMS campaigns)
- [ ] Set up Stripe products and price IDs
- [ ] File remaining provisional patents with your attorney
- [ ] Set up Pioneer Appalachia FCU business bank account
- [ ] Connect custom domain in Vercel
- [ ] Add `robots.txt` and privacy policy page
- [ ] Enable Supabase email templates (custom branding)
