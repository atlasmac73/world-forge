# THE ARK — Beta Launch Checklist

## 🔴 BLOCKERS — Must Complete Before Any Invite

### Infrastructure
- [ ] Supabase project created
- [ ] All 5 schema files run in correct order (see SUPABASE_SETUP.md)
- [ ] `profiles` table exists and trigger is active
- [ ] `invites` table exists
- [ ] `feature_flags` table seeded with defaults
- [ ] Supabase Auth: Email (Magic Link) enabled
- [ ] Supabase Auth: Site URL and redirect URL set

### Vercel
- [ ] Repo pushed to GitHub
- [ ] Vercel project created from GitHub repo
- [ ] All required env vars set in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `INVITE_SECRET`
- [ ] `npm run build` passes (confirmed locally and in Vercel)
- [ ] Vercel deployment succeeds (green checkmark)

### Owner Account
- [ ] Sign in with your own email (magic link)
- [ ] Run `seed_owner.sql` in Supabase SQL Editor with your email
- [ ] Verify Admin portal appears in sidebar
- [ ] Test creating an invite for yourself
- [ ] Test invite flow end-to-end (create → link → accept → sign in)

---

## 🟡 SHOULD COMPLETE Before First Invites

- [ ] `ANTHROPIC_API_KEY` added to Vercel → AI Copilot (LUKA) works
- [ ] Test LUKA in the Copilot panel
- [ ] Test Deal Navigator → AI distress score
- [ ] Test LOI Generator
- [ ] Test Agent Lab with at least one agent run
- [ ] Beta Feedback button works (submit → check Supabase `beta_feedback` table)
- [ ] Logout button works (TopBar → logout icon)
- [ ] Unauthenticated visit to `/` redirects to `/login`
- [ ] Invalid invite token shows error page

---

## 🟢 NICE TO HAVE Before Broader Beta

- [ ] Custom domain connected in Vercel
- [ ] Supabase email templates branded with ATLAS identity
- [ ] 5-10 person invite list drafted
- [ ] Feedback response process documented
- [ ] Known Limitations page reviewed and current

---

## Commands to Run Locally Before Deploy

```bash
npm install          # Should complete with 0 errors
npm run typecheck    # Must show: 0 errors
npm run lint         # Must show: 0 errors
npm test             # Must show: 13 passed
npm run build        # Must show: ✓ Compiled successfully
```

---

## Final Acceptance Criteria

The app is NOT beta-ready until ALL of these pass:

- [ ] A new invited user can sign in via magic link
- [ ] A non-invited user sees login page and cannot proceed
- [ ] Owner/admin can create invites in Admin portal
- [ ] Dashboard loads without JavaScript errors
- [ ] LUKA AI copilot responds (requires ANTHROPIC_API_KEY)
- [ ] Beta Feedback button submits successfully
- [ ] Supabase RLS: user cannot see another user's properties
- [ ] Service role key is NOT visible in browser DevTools → Network tab
- [ ] `npm run build` passes
- [ ] Vercel deployment is green
