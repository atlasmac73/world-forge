# ATLAS v67 — Changed Files Report (PATCHED)
**Generated:** June 18, 2026
**Package:** ATLAS_v67_WORKING_FINAL_PATCHED.zip
**Prior package:** ATLAS_v67_WORKING_FINAL.zip — had 9 runtime blockers, now fixed

---

## Final Check Status

| Check | Result |
|-------|--------|
| `npm ci` | ✅ PASS |
| `typecheck` | ✅ PASS — 0 errors |
| `lint` | ✅ PASS — 0 warnings |
| `test` | ✅ PASS — 22/22 |
| `build` | ✅ PASS — 9 pages |
| secrets scan | ✅ PASS — 0 found |

---

## 9 Blockers Fixed

| # | Blocker | Fix |
|---|---------|-----|
| 1 | profiles.id vs profiles.user_id | All new routes use requireAdmin() which queries user_id correctly |
| 2 | RLS policies used id = auth.uid() | Fixed to user_id = auth.uid() and is_active = true |
| 3 | cost_tier missing 'free' | Added 'free' to check constraint |
| 4 | Chat route queried non-existent profiles columns | Rewrote to use profiles(role, is_active) + subscriptions(tier_code, credits) |
| 5 | dossier imported kill switch but never called it | Added checkKillSwitch call after auth |
| 6 | sprint_log had no unique constraint | Added sprint_number unique + ON CONFLICT DO UPDATE seed |
| 7 | health route returned no Command Center metrics | Added agent_runs, blueprints, pending_approvals, genesis_cycles, sprints |
| 8 | superllm not in TopBar titles; KillSwitchWidget not wired | Added title + widget for T7/NASDROP users |
| 9 | Model IDs hard-coded | Replaced with env var map + safe fallbacks + TODO comment |

---

## Files Modified in Hotfix Pass

app/admin/command-center/page.tsx — requireAdmin + subscriptions.tier_code
app/api/system/killswitch/route.ts — requireAdmin pattern
app/api/genesis/blueprints/route.ts — requireAdmin pattern
app/api/portals/[portalId]/chat/route.ts — user_id queries; subscriptions budget; env-var models
app/api/agents/dossier/route.ts — added missing kill switch call
app/api/health/route.ts — returns metrics + sprints
components/TopBar.tsx — superllm title + KillSwitchWidget for T7/NASDROP
supabase/schema_v67.sql — RLS user_id; cost_tier free; sprint unique + upsert

---

## All New Files (v67)

app/admin/command-center/page.tsx
app/api/system/killswitch/route.ts
app/api/genesis/blueprints/route.ts
app/api/portals/[portalId]/chat/route.ts
components/KillSwitchWidget.tsx
components/portals/SuperLLM.tsx
components/admin/CommandCenterClient.tsx
lib/agents/killSwitch.ts
supabase/schema_v67.sql

---

## All Modified Files (cumulative)

store/useArkStore.ts — 'superllm' added to Portal type
components/Sidebar.tsx — SuperLLM in Genesis section
components/app/TheArkApp.tsx — SuperLLMPortal import + PORTAL_MAP
components/TopBar.tsx — superllm title + KillSwitchWidget
app/api/health/route.ts — Command Center metrics
app/api/agents/run/route.ts — kill switch
app/api/agents/distress-score/route.ts — kill switch
app/api/agents/document-summary/route.ts — kill switch
app/api/agents/dossier/route.ts — kill switch (hotfix: call was missing)
app/api/agents/loi/route.ts — kill switch
app/api/agents/skip-trace/route.ts — kill switch
app/api/agents/task-extraction/route.ts — kill switch

---

## What Was NOT Done

No new features added in hotfix pass.
No Supabase migration run on live DB.
No GitHub push.
No Vercel deployment.
No Stripe/Twilio/BatchSkipTracing enabled.
