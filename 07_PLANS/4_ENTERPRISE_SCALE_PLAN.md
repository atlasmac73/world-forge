# Plan 4 — Enterprise Scale Plan
**ATLAS / THE ARK v67**
**Depends on:** Plan 3 (Production SaaS), 06_AUDIT/L

---

## 1. Thesis

Per **L. Enterprise Readiness**, the multi-tenant *schema* foundation is real (organizations,
org_members, role_permissions, org_id-aware RLS on new tables) but the *product surface* for
multi-org usage does not exist yet. This plan is explicitly **not started** until the open
question in L §4 is resolved.

## 2. Blocking Pre-Work (Must Happen First)

**Resolve: is `getUserRole`/`role_permissions` global-per-user or scoped-per-org-membership?**
This single decision determines the entire security model for every enterprise table going
forward. Do not write any enterprise-tier RLS policy or route guard until this is explicitly
confirmed by inspecting `lib/permissions/index.ts` against real org-membership data, or decided
fresh with the owner if it's genuinely ambiguous today.

## 3. Workstreams (Sequenced After the Blocking Decision)

### 3.1 Org Management UI
- Org creation, org member invite/remove, org-level role assignment.
- Org-switching UI for users who belong to multiple orgs.

### 3.2 Billing Model Resolution
- Confirm/finalize whether billing (from Plan 3) is per-user or per-org. If per-org, this
  requires a `subscriptions`-table relationship change or a new org-billing table — do not
  retrofit this casually; it's a data-model decision with migration implications.
- Pooled/shared credit quotas at the org level for Tool Gateway usage (currently individual-
  subscription-based only).

### 3.3 Audit Log Scoping
- Confirm/implement org-admin visibility into only their own org's `audit_logs` rows (vs.
  requiring platform-owner access). This is an RLS policy addition, not a new table.

### 3.4 Franchise/Expansion Tooling (If In Scope)
- Confirm with owner whether "Enterprise Scale" includes franchise/multi-location-specific
  tooling beyond generic multi-tenant SaaS (referenced in prior roadmap material but with no
  corresponding tables/pages found in this audit). If yes, this is new schema + new pages, not
  a wiring fix — scope it as its own sub-project once confirmed, do not silently fold it into
  generic org support.

### 3.5 Scale/Performance
- Not independently load-tested in this audit. Before claiming enterprise-scale readiness,
  validate: query performance on `agent_runs`/`audit_logs` at high row counts, RLS policy
  performance overhead at scale, and Command Center/GodView dashboard load times with
  realistic multi-org data volume.

## 4. Explicit Non-Goals (Until Confirmed In Scope)

- Do not build franchise-specific schema speculatively — confirm scope first (governance:
  "do not build out genuinely unspecified stub portals without confirming scope first" applies
  directly here).
- Do not change the global RBAC hierarchy (owner/admin/beta_tester/contractor/viewer) — extend
  it with org-scoping if needed, don't replace it.

## 5. Definition of Done

- Org-scoping question resolved and documented.
- Org management + org-switching UI live.
- Billing model (per-user vs per-org) finalized and consistent across the product.
- Org-scoped audit log visibility implemented.
- Franchise/expansion scope explicitly confirmed in or out, not left ambiguous.
