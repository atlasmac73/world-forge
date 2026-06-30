# ATLAS — Do Not Build Yet
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Updated:** June 18, 2026

This file is the v67 scope fence. Every item listed here is explicitly deferred.
Do not add these to any v67 sprint. Do not stub them in production UI as "coming soon."
Add them to v68+ planning only.

> **Owner override — 2026-06-25:** Isaac approved building the **AI Tournament / self-eval**,
> the **Research Notebook (NotebookLM-style)**, and completing the **Genesis SIMULATE** phase now.
> These are no longer fenced (see entries below + `docs/ATLAS_DECISION_LOG.md` 2026-06-25). They
> ship founder/admin-only at `/admin/research-arena`. Everything else here remains deferred.

---

## Hard Deferred (v68+)

| Item | Why Deferred |
|------|-------------|
| Full ATLAS WORLD / ATLAS TIME | Requires separate engine, not revenue-generating for beta |
| Mars / Cosmos modules | Long-term empire expansion, not real estate SaaS |
| Consciousness upload | Phase Omega concept only |
| Deceased reconstruction | Phase Omega concept only |
| Full 1,000-skill autonomous system | Needs agent marketplace infrastructure |
| Full 255-agent autonomous system | Requires orchestration layer not yet built |
| Omniverse as primary UI | Long-term metaverse shell, not v67 |
| Autonomous code auto-merge to production | Safety — must remain approval-gated |
| Full VR/XR world engine | Hardware/engine dependency |
| Full transmedia production suite | Leon Therano Universe — creative division |
| Full contractor business OS (BidHub/Omega) | Separate product line |
| Full property management OS | PM portal shell only in v67 |
| Full marketplace / economy | Requires payment rails beyond Stripe |
| Auto-send SMS blasts | TCPA/STOP/opt-out compliance not yet built |
| Bulk automated outreach | Same as above |
| Full voice calling / auto-dial | Twilio A2P 10DLC approval pending |
| White-label deployment engine | Franchise Console — v68 |
| Multi-location franchise console | Sovereign Vault / Franchise Console — v69 |
| Decentralized identity (Web3) | Future identity layer |
| SP6 / token economy | Long-term platform economy |
| Full SPECTER court record scraper | Requires court data agreements |
| n8n workflow automation | Infrastructure not set up in v67 |
| Mapbox D4D real-time satellite | Requires Mapbox paid plan + token |
| BatchSkipTracing live integration | Requires API key + billing account |
| PropStream connector | Requires PropStream API agreement |
| Google Drive / Gmail / Calendar connectors | OAuth connectors — Phase 5 roadmap |

---

## Conditional — Build When Ready

| Item | Condition |
|------|-----------|
| Real SMS send | After Twilio A2P 10DLC approved (~4 weeks) |
| Skip trace (BatchSkipTracing) | After BATCH_SKIP_TRACE_KEY obtained |
| Mapbox AIN map layer | After MAPBOX_TOKEN obtained |
| Stripe billing active | After Stripe products created + keys in Vercel |
| GitHub PR auto-create | After GitHub Actions + PAT set up |
| Sentry error tracking | After Sentry DSN obtained |
| PostHog analytics | After PostHog project created |
| n8n webhooks | After n8n instance deployed |

---

## Specifically Not v67 Despite Being in GodMode v12 Spec

| v12 Feature | v67 Decision |
|-------------|-------------|
| Periodic Table of AI (full UI) | Admin agent registry only — no public-facing |
| Full 10-mode SuperLLM | 3 modes live (Chat, Genesis, Autopilot), rest stub |
| SP6 Wallet / token economy | Deferred — use Stripe only |
| ~~Model tournament / self-eval~~ | ✅ BUILT 2026-06-25 (owner override) — founder/admin-only at `/admin/research-arena`, not for beta users |
| 255 named agents registry | Seed 25 MVP agents only |
| Full swarm nexus orchestration | LangGraph integration — v68 |

---

## Note on Autopoietic / Genesis Engine

The Genesis Engine (6-phase cycle: SENSE→INTERPRET→MUTATE→SIMULATE→PROMOTE→LEARN)
exists in v67 and is wired for founder/admin use ONLY.

**Update 2026-06-25:** the SIMULATE phase is now implemented — it runs proposed blueprints
through the tournament engine (LLM-judge) to assign real confidence scores. This is evaluation
only; it writes `confidence_score` + `simulation_result` and does NOT change blueprint status.

It is explicitly STILL NOT:
- Autonomous (requires human approval at PROMOTE stage — gate unchanged)
- Self-deploying (no auto-merge to production)
- User-facing (admin/owner only)

Keep it this way for all of v67.
