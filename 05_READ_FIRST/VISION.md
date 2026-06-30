# VISION — What ATLAS / THE ARK Is Building Toward

Synthesized from `README.md`, `PRODUCTION_SAAS_ROADMAP.md`, `docs/V67_MERGE_PLAN.md`,
and `ADMIN_GUIDE.md`. This is a description of stated intent across those documents,
not new aspiration invented for this handoff.

## The product

THE ARK is positioned as a **sovereign AI operating system for real estate
intelligence, agent automation, and deal management** — built first for the West
Virginia / Appalachian market, with stated intent to expand nationally (see the
"National Expansion" and "Market Expansion" portal slots, currently unbuilt stubs).

It is not a single tool — it's an umbrella of "portals," each a different
workflow: deal sourcing and scoring (Deal Navigator / Signal Stack / AIN Heatmap),
contractor and rehab management, AI agent orchestration ("Agent Lab," "God Squad"
agents), document/communication tooling, and admin/observability surfaces (Trust
Dashboard, GodView, Launch Readiness).

## The business model

A tiered SaaS (`T1`–`T7`, `lib/permissions` / `TIER_ORDER`), gated by subscription
tier and a daily AI-credit allowance per user. Stripe billing infrastructure exists
in code (`app/api/billing/*`) but is intentionally feature-flagged off until real
Stripe products/price IDs are configured — see `ROADMAP.md`.

## The self-improvement thesis ("Genesis" / "Autopoietic")

A distinguishing, repeatedly-emphasized idea across the merge docs: the platform is
meant to **propose improvements to its own codebase** via a `SENSE → INTERPRET →
MUTATE → SIMULATE → PROMOTE → LEARN` cycle (`lib/autopoietic/heartbeat.ts`), but
**never auto-deploy** them. Every mutation becomes a "blueprint" that a human
(owner/admin) must explicitly approve or reject (`build_blueprints` table,
`/api/heartbeat/approve`). A kill switch (`system_config.kill_switch`) can halt all
AI/agent execution instantly. This human-approval-gated self-improvement loop is the
core differentiator the project keeps returning to in its own documentation — treat
it as a permanent design constraint, not a feature to streamline away.

Two related-but-distinct systems share the "Genesis" name and must not be merged:
- **Genesis HQ** (`genesis_hq_*` tables) — a separate, founder-facing portal.
- **Genesis Cycle** (`genesis_cycles`, `build_blueprints`, `genesis_mutations`) — the
  self-improvement engine described above.

## IP posture

Per the IP declarations repeated across `README.md`, `DEPLOY.md`, `DEPLOYMENT.md`,
and `V66_PHASE0_PATCH_NOTES.md`: all code, design, and concepts are stated to be the
exclusive property of Isaac Brandon Burdette / Atlas Genesis Matrix LLC, with a
provisional patent portfolio (P001–P100, "OMNIFOLD™") and a stated non-provisional
filing deadline of March 29, 2027. This is asserted in the docs, not something this
handoff package verifies — carry it forward as-is, don't alter or remove it.

## Stated milestones (from `PRODUCTION_SAAS_ROADMAP.md`, dates not re-verified this session)

| Milestone | Trigger |
|-----------|---------|
| Beta (current) | 10–25 invite-only users |
| Revenue | Stripe + skip trace + AIN live |
| Comms | Twilio A2P 10DLC approved, connectors live |
| Scale | 100+ users, observability live |
| Public Launch | Legal pages, security audit, load test |

Treat this table as directional, not a commitment — several of its triggers depend
on external approvals (Stripe, Twilio) outside engineering's control. See
`ROADMAP.md` for current status against each.
