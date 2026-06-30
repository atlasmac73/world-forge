# L. Enterprise Readiness Assessment
**ATLAS / THE ARK v67**

---

## 1. Definition Used Here

"Enterprise readiness" = can this platform serve multiple organizations/teams with proper
isolation, role delegation, and scale characteristics — distinct from MVP (single-user/small-
team usage) and Production SaaS (billing-enabled single-tenant-per-account usage).

## 2. What Exists Today

- **Multi-tenant schema foundation is real**, not aspirational: `organizations`, `org_members`,
  `role_permissions` tables exist (Phase 3 of the merge plan), and per Merge Rule #2/#3, all
  new tenant-owned tables added since carry `org_id` and org/role-aware RLS (confirmed by the
  database inventory pass — 100% RLS coverage extends to these).
- RBAC hierarchy (`owner > admin > beta_tester > contractor > viewer`) is generic enough to
  extend to per-org roles, though the current `getUserRole`/`requireRole` implementation was
  not confirmed to be org-scoped (vs. global) in this pass — this is the key open question for
  enterprise readiness (see Section 4).

## 3. What's Missing

- **Org-switching UI** — no confirmed front-end flow for a user who belongs to multiple
  organizations to switch context. Schema supports it; product surface does not (yet) expose it.
- **Franchise / expansion concepts referenced in prior roadmap material are pure stubs** — no
  corresponding tables or pages were found beyond the generic `organizations` foundation. If
  "Enterprise Scale" in the owner's vision implies franchise/multi-location distinct tooling
  (vs. generic multi-tenant SaaS), that is unbuilt, not partially-built.
- **Per-org billing** — Stripe is not wired at all yet (see H/I); whatever billing model
  eventually ships needs to decide whether billing is per-user or per-org, which has not been
  decided in code today (subscriptions table is keyed off user, not org, in the schema as
  currently understood — recommend explicit confirmation before Plan 4 is finalized).
- **Per-org audit log scoping** — `audit_logs` exists and is populated, but whether an org-admin
  can see only their own org's audit trail (vs. requiring platform-owner access) was not
  confirmed in this pass.
- **Per-org agent/tool quotas** — Tool Gateway's tier/credit gating is currently tied to
  individual subscriptions, not org-level pooling. Enterprise customers typically expect
  pooled/shared seats and quotas — not present today.

## 4. Key Open Question for Plan 4 (Enterprise Scale)

Is `getUserRole`/`role_permissions` global-per-user or scoped-per-org-membership? This
determines whether "admin" means "admin of the whole platform" or "admin of one org" — a
fundamentally different security model. This was not definitively resolved in this audit pass
and should be the **first thing confirmed** before any enterprise-tier feature work begins,
since it affects RLS policy design for every future enterprise table.

## 5. Verdict

**Foundation exists, product surface does not.** The schema-level work for multi-tenancy is
real and follows the project's safety conventions (org_id everywhere, RLS enforced). The gap is
entirely in: (a) UI for org management/switching, (b) billing model decision (per-user vs.
per-org), (c) confirming role-scoping semantics, (d) any franchise-specific tooling if that's
part of the vision. None of this should be started until the Section 4 open question is
resolved with the owner — see **07_PLANS/4_ENTERPRISE_SCALE_PLAN.md**.
