# ATLAS Open Questions

Status: CURRENT

Real unresolved questions that need an owner decision before related work can proceed. Remove a
question once it's answered (move the answer to `docs/ATLAS_DECISION_LOG.md`).

## Open

1. **Legacy SPA vs App Router consolidation** — per `06_AUDIT/D_PORTAL_INVENTORY.md` §4: should
   new navigation work retrofit links into the legacy Sidebar/PORTAL_MAP, or should the repo
   start consolidating toward the App Router as the canonical system? Affects how much current
   work is "throwaway." Flagged as needing an owner call before nav work starts at scale.
2. **Invite-only enforcement gap** — `components/app/LoginPageClient.tsx` calls
   `supabase.auth.signInWithOtp` directly with no invite-token check, so the "private,
   invite-only beta" claim in the UI is currently copy only, not an enforced gate. Is fixing
   this in scope now, or deferred to `07_PLANS/2_PRIVATE_BETA_PLAN.md`?
3. **Genesis Integration Packet scope/timing** — owner has specified the 10-file packet
   structure (PRD, data model, seed data, admin/security, UI spec, acceptance checklist, future
   roadmap, ownership/IP rules, etc.) but not yet given the explicit go-ahead to start writing
   it. When should this start?
4. **GitHub repo creation** — `gh repo create` is expected to fail in this environment due to
   the `api.github.com` network block (see `docs/ATLAS_BUILD_LOG.md`); the private repo needs to
   be created via the GitHub website by the owner, then the remote URL given back for `git
   push`. Has the repo been created yet, and what's the remote URL?

## Claude Instruction

Don't silently guess on anything listed here — surface it to the owner. Don't let this file
grow stale; if a question becomes irrelevant, remove it rather than leaving it to rot.
