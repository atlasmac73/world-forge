# 06_AUDIT Index

Status: CURRENT

This folder is the factual audit of ATLAS / THE ARK v67 — what actually exists in the repo today.
Read this to understand current state before making changes; read `07_PLANS/` to understand what
to do next.

## Read Order

1. A_REPOSITORY_AUDIT.md — repo shape, folders, current systems
2. B_ARCHITECTURE_MAP.md — system layers, API, agents, Genesis Cycle
3. D_PORTAL_INVENTORY.md — legacy SPA vs App Router navigation gap
4. E_DATABASE_INVENTORY.md — Supabase tables, RLS, schema notes
5. F_API_INVENTORY.md — API route map and audit gaps
6. I_SECURITY_ASSESSMENT.md — auth, RLS, secrets, audit logging
7. K_MVP_READINESS.md — investor core loop readiness
8. J_MISSING_FUNCTIONALITY.md — actual missing pieces
9. G_AGENT_INVENTORY.md — real agents, stubs, Tool Gateway
10. H_PRODUCTION_READINESS.md — deployment readiness and blockers
11. C_FEATURE_INVENTORY.md — feature-by-feature status
12. L_ENTERPRISE_READINESS.md — multi-org and enterprise state

## Key Findings (as of last audit)

- MVP core loop is mostly built at code level; main blocker is navigation/wiring, not missing
  features.
- The repo has two front-end systems (legacy SPA shell + Next.js App Router) — see
  D_PORTAL_INVENTORY.md and `CLAUDE.md` §6.
- Supabase/RLS foundation is generally strong, but schema files have real cross-file conflicts —
  see `supabase/` notes in `CLAUDE.md` §7 (the `organizations` table conflict between
  `schema_pilot.sql` and `schema_v67_master.sql` found during live-DB verification).
- Genesis Cycle (A03) exists but is manual/human-gated — preserve that.

## Claude Instruction

Don't restart a full audit by default; these docs are current. Re-verify against actual code only
when something here looks stale or contradicts what you find while implementing.
