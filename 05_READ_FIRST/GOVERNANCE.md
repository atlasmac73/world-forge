# GOVERNANCE — Rules Every Change Must Follow

These are not suggestions. They're synthesized from `docs/V67_MERGE_PLAN.md`'s
"Merge Rules," `SECURITY_NOTES.md`, `lib/permissions/index.ts`, and
`lib/autopoietic/limits.ts` — i.e., rules already enforced in code, not new policy
invented for this handoff. Violating any of these is a regression, not a style choice.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It bypasses RLS. It must never reach
  client code, never be logged, never appear in a client bundle.
- Same rule for `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  Twilio credentials — server-only, always.
- `NEXT_PUBLIC_*` vars (Supabase URL, anon key) are the only ones safe to expose —
  RLS is what protects data, not secrecy of the anon key.
- No client-side API key storage of any kind (explicit carry-forward rule from the
  v20 merge — do not reintroduce this pattern even if a source codebase being merged
  in does it).

## Data access / multitenancy

- Every new tenant-owned table gets `org_id` and RLS — no exceptions, no "we'll add
  RLS later."
- Replace any user-only RLS policy with an org/role-aware one as you touch it —
  don't leave a table half-migrated.
- Never rely on client-side checks for permissions. Every owner/admin gate must be
  re-checked server-side, using `lib/permissions/index.ts`
  (`requireUser`/`requireAdmin`/`requireOwner`/`isAdmin`/`isOwner`), not just hidden
  in the UI.

## RBAC hierarchy (`lib/permissions/index.ts`)

```
owner (100) > admin (80) > beta_tester (40) > contractor (30) > viewer (10)
```

`requireRole`/`requireAdmin`/`requireOwner` return `{role, error: null} |
{role: null, error: NextResponse}` — non-throwing, check the `error` field, don't
wrap in try/catch expecting a throw.

## Audit logging

- Every admin action and every state-changing action writes a row to `audit_logs`
  via `lib/audit/logger.ts`'s `writeAuditLog`/`writeAuditLogs` — non-throwing,
  service-role, fire-and-forget is fine but it must happen.
- `AuditAction` is a closed string-literal union — add new actions to that union
  rather than passing free-text strings.

## Genesis / Autopoietic self-improvement engine

- **No code is ever auto-deployed.** Every mutation the engine proposes becomes a
  `build_blueprints` row with status `PROPOSED`/`UNDER_REVIEW` and must be
  explicitly approved by an owner/admin via `/api/heartbeat/approve` before any
  further action is taken — this is enforced today, do not weaken it.
- `AUTOPOIETIC_LIMITS` (`lib/autopoietic/limits.ts`) caps blueprints per cycle (3),
  enforces a minimum interval between heartbeat cycles (15 min), and forces human
  approval for `HIGH`/`CRITICAL` risk or `schema_change`/`security`/`agent_update`
  blueprint types — these thresholds are policy decisions, don't loosen them without
  the owner's explicit sign-off.
- The kill switch (`system_config.kill_switch`, checked via
  `lib/agents/killSwitch.ts`'s `checkKillSwitch`) must be checked by any new
  AI/agent-execution route. It fails *open* (not armed) if the config table is
  unreachable — that's intentional (availability over false-positive lockout), don't
  flip it to fail-closed without discussing the tradeoff.
- Arming/disarming the kill switch is admin/owner-gated server-side
  (`/api/system/killswitch`) and requires a confirmation dialog client-side
  (`components/KillSwitchWidget.tsx`) — reuse that component, don't build a second
  kill-switch toggle (this was a real mistake caught and fixed during this session).

## Namespace separation

`Genesis HQ` (`genesis_hq_*` tables, founder-facing portal) and the `Genesis Cycle`
self-improvement engine (`genesis_cycles`/`build_blueprints`/`genesis_mutations`)
share a name but are different systems. Do not merge their tables, routes, or UI.

## Validation, testing, and review

- Zod validation on all API inputs.
- Every change must pass: `tsc --noEmit`, `eslint`, `next build`, before being
  considered done — not just "looks right."
- Demo/mock data must be clearly labeled in the UI (`is_demo` fields exist in
  several tables for exactly this reason — use them, don't silently mix demo and
  real data).

## Code reuse

Before building a new component/route, check whether one already exists —
duplicating an existing safety-relevant component (like the kill switch widget) can
silently drop safety behavior (the confirm dialog, in that case) that the original
had. Grep first.

## Out of scope, explicitly

- `genesismasteroperationspacket.docx` — a separate business-venture document
  (different entity, same named individual as this project's owner). Do not merge,
  reference, or treat as input to this codebase's roadmap.
- Building out genuinely unspecified stub portals (see `ROADMAP.md`'s "needs your
  input" section) without confirming scope first — a one-line mention in a planning
  doc is not a spec.

## IP / ownership

All code, design, and concepts in this repository are asserted (per `README.md` and
other root docs) to be the exclusive property of Isaac Brandon Burdette and Atlas
Genesis Matrix LLC, with an active provisional patent portfolio. Don't add license
files, third-party attribution headers, or open-source declarations without the
owner's explicit instruction.
