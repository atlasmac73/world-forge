# K. MVP Readiness Assessment
**ATLAS / THE ARK v67**

---

## 1. Definition of "MVP" Used Here

The minimum product a real investor-user (the primary persona per VISION.md/ROADMAP.md) could
use end-to-end without hitting a dead end, a stub, or a silent failure — distinct from "Private
Beta" (K vs. Plan 2) which adds a small group of real outside users, and distinct from
"Production SaaS" (Plan 3) which adds billing/scale.

## 2. MVP Core Loop (Investor Persona)

```
Sign up/invite → land on dashboard → find distressed properties (AIN/scoring/top250)
→ pull a dossier (SPECTER) → run underwriting (OMEN) → move into pipeline → take action
```

## 3. Readiness Against That Loop

| Step | Built? | Reachable? | MVP-Ready? |
|---|---|---|---|
| Sign up/invite | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| AIN heat map | ✅ | ❌ not linked | ❌ — blocks the loop at step 2 |
| Distress scoring | ✅ | ❌ not linked | ❌ |
| Top 250 | ✅ | ❌ not linked | ❌ |
| Dossier (SPECTER) | ✅ | partial | ⚠️ depends on entry point |
| Underwriting (OMEN) | ✅ | ❌ not linked | ❌ |
| Pipeline (Kanban) | ✅ | ❌ not linked | ❌ |

**Conclusion: the MVP core loop is fully built at the code level and fully blocked at the
navigation level.** This is the single most important finding of the entire audit: ATLAS v67
does not have an "MVP feature gap" so much as an "MVP wiring gap." Closing the navigation/
discoverability gap identified in D/H/J would likely move MVP readiness from ~40% (user-
perceived) to ~85%+ (since nearly everything needed already exists in code).

## 4. Remaining True Feature Gaps for MVP (Not Just Wiring)

- Mapbox token needed for AIN heat map to show real geography (works in demo mode without it,
  but demo mode must be clearly labeled per governance — confirm this labeling exists).
- BatchSkipTracing key needed if skip-trace is part of the MVP promise; if not, defer.
- Live property/distress data sourcing — confirm whether `counties`/`distress_signals` are
  populated with real data or only the 55-county seed/demo structure. (Not independently
  re-verified this pass; flagged as a fast follow-up check.)

## 5. MVP Hard Blockers (From H. Production Readiness)

- Secrets rotation
- First GitHub push / first Vercel deployment (currently zero of either)
- Schema run on live Supabase project

## 6. MVP Readiness Verdict

**Not yet MVP-ready, but closer than the raw feature-count would suggest.** The path to MVP is
short and well-defined: (1) close the nav-wiring gap, (2) clear the 3 hard deployment blockers,
(3) confirm AIN/scoring run against either real or clearly-labeled demo data. No new agent, no
new schema, and no new page is required to reach MVP — this is the central insight that should
drive **07_PLANS/1_MVP_COMPLETION_PLAN.md**.
