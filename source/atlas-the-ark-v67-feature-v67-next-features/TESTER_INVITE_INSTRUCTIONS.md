# THE ARK — How to Invite Beta Testers

## As Owner/Admin

### Method 1: Admin Portal (Recommended)

1. Sign in to THE ARK
2. Click **Admin** in the sidebar
3. Go to **Invites** tab
4. Enter the tester's email → select role → click **Create Invite**
5. The invite link is auto-copied to your clipboard
6. Send the link to your tester via text, email, or DM

### Method 2: API (For Power Users)

```bash
curl -X POST https://your-app.vercel.app/api/admin/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"email": "tester@example.com", "role": "beta_tester", "expires_in_days": 7}'
```

---

## What the Tester Receives

1. An invite link: `https://your-app.vercel.app/invite?token=abc123`
2. They visit the link
3. They click **Accept invite & sign in**
4. A magic link is sent to their email
5. They click the magic link and are signed in

---

## Roles

| Role | Access |
|------|--------|
| `beta_tester` | Full app access (default for friends/family) |
| `viewer` | Read-only access to dashboards |
| `contractor` | Contractor portal access |
| `admin` | Can invite others, see all feedback, manage flags |

---

## Suggested Invite Order

1. **Yourself** — verify the full flow works
2. **Misty Morrison** — contractor portal focus
3. **Close family/friends** — general beta
4. **Real estate contacts** — deal analysis focus
5. **Broader WV network** — after first week of feedback

---

## Revoking Access

In Admin portal → Invites → click the X to revoke a pending invite.

To deactivate an existing user:
```sql
UPDATE profiles SET is_active = FALSE
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```
