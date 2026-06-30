# THE ARK — Private Beta Runbook
**Phase 12 of V67_MERGE_PLAN.md — "Private Beta Package"**
**Owner: Isaac Brandon Burdette · Atlas Genesis Matrix LLC**

Practical operations reference for running the private beta. Not a sales doc.

---

## 1. Pre-Launch Checklist

Full step-by-step setup lives in [`DEPLOYMENT_CHECKLIST.md`](../DEPLOYMENT_CHECKLIST.md) — do not duplicate it here, follow it in order. Summary of what it requires:

- **Supabase**: run `schema.sql`, `schema_canon.sql`, `schema_beta.sql`, and `migrations/20260620_autopoietic_schema.sql` (required for the Autopoietic Console — kill switch config, blueprints, model registry, genesis_cycles). Enable magic-link auth, set Site URL + redirect URL to the Vercel domain, disable email confirmations.
- **Vercel env vars (required)**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`, `INVITE_SECRET`, `ADMIN_EMAILS`.
- **Vercel env vars (optional, add when ready)**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
- **First owner account**: sign in via magic link, run `supabase/seed_owner.sql` (edited with the owner's email), confirm `profiles.role = 'owner'`.
- **Post-deploy verification**: login page loads for unauthenticated users, magic link arrives within 60s, `/api/heartbeat` returns 200, portal navigation works, Beta Feedback button visible, Admin portal invite manager visible to owner/admin.

Do not launch beta invites until every box above is checked.

---

## 2. Known External Blockers

These are **credentials and business-process gaps, not code gaps**. The code paths exist and are feature-flagged off until the underlying third-party account is provisioned. Only Isaac Brandon Burdette can complete these (account ownership / business verification required):

| Blocker | What's needed | Impact while pending |
|---|---|---|
| **Stripe** | Live secret/publishable keys + price IDs | Billing is Phase 8, status PENDING in the merge plan. `pay` portal stays in "coming soon" state until keys + price IDs are set and `BILLING_ENABLED` flag is turned on. |
| **Twilio A2P 10DLC + Voice** | Carrier registration (10DLC campaign approval) and Voice number provisioning. This is an external approval process that typically takes **2–4 weeks**. | The `voice` portal cannot go live, and SMS auto-send cannot be fully enabled, until registration clears. SMS stays gated behind `SMS_ENABLED` even after Twilio creds are added. |
| **Mapbox token** | A Mapbox account + API token | AIN heat map and D4D (Driving for Dollars) map visual layers are degraded/unavailable without it. |
| **BatchSkipTracing API key** | Account + API key with BatchSkipTracing | The `skip-trace` (A12-SPECTER) portal cannot go live without it — currently shown as a "coming soon" stub. |

None of these block the rest of the beta. Everything else in section 1 is independent of these accounts.

---

## 3. Kill Switch Usage

The kill switch is a global, database-backed flag (`system_config.key = 'kill_switch'`) that halts AI/agent execution without a redeploy.

**Where**: Kill Switch widget in the TopBar (mini icon) and in the admin/sidebar (full button), backed by `GET`/`POST /api/system/killswitch`.

**Who**: Any authenticated user can view state (`GET`). Only `owner`/`admin` roles can arm or disarm it (`POST`, enforced via `requireAdmin`).

**What it does when armed**:
- All `/api/agents/*` routes return `503` immediately (checked via `lib/agents/killSwitch.ts`'s `checkKillSwitch`).
- It does **not** block the rest of the app — login, portals, and non-AI features keep working.
- Every arm/disarm action is written to `audit_logs` (`KILL_SWITCH_ARMED` / `KILL_SWITCH_DISARMED`).

**When to use it**:
- The Genesis Cycle / Autopoietic engine (SENSE → INTERPRET → MUTATE → SIMULATE → PROMOTE → LEARN) misbehaves — runs out of control, proposes bad mutations, or burns excessive API spend.
- Any agent run starts behaving unexpectedly or a model/prompt regression is suspected.
- As a precaution while investigating any AI-related incident report from a beta tester.

**Note**: the kill switch check fails open (treats `armed: false`) if `system_config` is unreachable — it is not a substitute for taking the app offline. For a full outage, use Vercel's deployment controls.

---

## 4. Rollback Procedure

Keep this simple — two independent levers, use whichever fits the situation:

1. **Halt AI/agent activity without a redeploy**: arm the kill switch (see §3). Fastest option, takes effect immediately, does not affect the rest of the app.
2. **Revert a bad deploy**: in Vercel, go to the project's Deployments tab and promote the last known-good deployment back to production ("Redeploy" / "Promote to Production"). This reverts app code instantly without touching the database.
3. **Database changes**: Supabase migrations in this project are additive (new tables/columns). If a migration causes a problem, do not run destructive rollback SQL against production without reviewing the specific migration first — schema changes are harder to undo than a code deploy.
4. **After rollback**: confirm `/api/heartbeat` returns 200, confirm login still works, then disarm the kill switch if it was armed for the same incident.

---

## 5. Beta Tester Onboarding

Role hierarchy, from `lib/permissions/index.ts`:

```
owner (100) > admin (80) > beta_tester (40) > contractor (30) > viewer (10)
```

- New beta testers are added through the **Admin → Invite Manager** (owner/admin only): enter the tester's email, generate an invite link, send it to them.
- Tester clicks the invite link → accepts → receives a magic-link email → signs in. Their `profiles.role` is set to `beta_tester` by the invite flow.
- A `beta_tester` account can access the LIVE portals (dashboard, deals, agents, contractors, trust, vault/settings, onboarding, roadmap, loi, comms, market, genesis-hq, ain) and the in-app Beta Feedback button.
- `beta_tester` is below `admin` in the hierarchy — they cannot reach the Admin portal, invite other users, toggle feature flags/kill switch, or access owner-only portals (NASDROP, Genesis Engine).
- All invite issuance and acceptance is token-based (`INVITE_SECRET`-signed) per the deployment checklist — there is no open self-signup.

---

## 6. What's Explicitly NOT Ready for Beta

The following portals render as "coming soon" stubs (`PreviewPortal` / `BetaDisabled` component) in `components/app/TheArkApp.tsx`'s `PORTAL_MAP`. Set tester expectations accordingly — these are visible in navigation but intentionally non-functional:

| Portal | Stated reason |
|---|---|
| **skip-trace** (A12-SPECTER) | Requires BatchSkipTracing API integration |
| **swarm** (Swarm Nexus) | Multi-agent orchestration via LangGraph |
| **voice** (Voice Agent) | Twilio Voice + A2P 10DLC required, after SMS registration |
| **transmedia** (Transmedia Universe) | Leon Therano saga + WorldForge engine — Phase 3 production feature |
| **akashic** (Akashic Records) | Document vault with vector search |
| **pay** (Billing & Plans) | Stripe billing requires price ID setup — see DEPLOYMENT_CHECKLIST.md |
| **community** (Community Hub) | Launching after 10 active beta users |
| **franchise** (Franchise Console) | Multi-location ARK deployment — enterprise tier feature |
| **patents** (Patent Registry) | IP management portal |
| **expansion** (Market Expansion) | Geographic expansion intelligence |
| **orchestra** (Orchestra) | Workflow automation engine |
| **blueprint** (Blueprint Intel) | Architectural intelligence layer |
| **legal** (Legal Hub) | Contract library and compliance tools |

Additionally, `living-graph`, `worldforge`, `genesis`, `nasdrop`, `cockpit`, and `war-room` are marked **PREVIEW** — visible and explorable for owner/admin, but not positioned as finished beta-tester-facing features yet.

`build` and `pm` portals currently reuse the Contractors portal as a placeholder rather than having dedicated implementations.
