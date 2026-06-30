# ATLAS Deal Navigator Pro v9.0 → v67 Feature Extraction Report

Source: `legacy/v9/DealNavigatorPro_v9_0.html` (21,837 lines, single-file HTML/JS/CSS prototype, no backend)
Target: `atlas-the-ark-v67-feature-v67-next-features` (Next.js 14 / Supabase production app)

## How v9 is organized

v9 is a **sector switcher**, not a role-based app — on load it shows a sector
picker (`selectSector`) for **Investor / Agent / Contractor / Homeowner /
Property Manager**, then renders a different nav + view set per sector
(`switchSector`, `renderSidebarNav`). There's no real auth; portal choice is
stored in `localStorage`. Underneath that sit ~394 JS functions covering
everything from lead tables to a fake "SP6" internal command-center/launch
tool to LangGraph/Neo4j graph-builder toys. It's best read as **a wide,
shallow spec document with some genuinely good UX ideas mixed into a lot of
demo theater.**

---

## Top 50 features in v9

1. Sector/portal switcher (Investor/Agent/Contractor/Homeowner/PM)
2. Lead pool table with tag filters (`leadPoolTable`, `filterLeads`)
3. Distress/opportunity tagging: Vacant, High Equity, Tax Delinquent, Absentee, Probate
4. Property detail modal (`showPropertyDetail`)
5. Deal calculator (`v9CalcDeal`, `v9BuildDealCalc`)
6. Rehab/repair estimate calculator (`calculateRehab`, `v9RehabEstimate`, `quickRehabEstimate`)
7. LOI/offer generator (`generateLOI`, `v9GenerateLOI`, `v9LOIAction`)
8. Comps finder (`v9FindComps`)
9. Skip trace action + modal (`v9SkipTrace`, `v9CreateSkipModal`, `runSkipTraceFromD4D`)
10. County records search (`runCountySearch`, `v9RunCountySearch`, `v9ExportCountyCSV`)
11. Map-based deal finder "D4D" (drag pin, add pin, export pins) (`buildD4DMap`, `initD4DMap`, `addD4DPinAtCenter`, `exportD4DPins`)
12. AI deal analysis (`v9AIDealAnalysis`)
13. AI copilot chat panel (`addCopilotMsg`, `sendCopilot`, `getCopilotHistory`)
14. AI call-assist mode w/ live call brief + script (`callAssistMode`, `generateCallBrief`, `generateCallScript`, `handleObjection`)
15. Outreach drafting: SMS/email/letter generators (`agentDraftMessage`, `aiDraftReply`, `generateLetter`)
16. Communications hub / inbox / threads (`buildCommsHub`, `openMailboxThread`, `sendMailboxReply`)
17. Outbox + offline queue with sync (`addToOutbox`, `flushOutbox`, `getOutboxCount`, `initOfflineEngine`, `toggleOffline`)
18. Pipeline / kanban board with drag-drop (`initPipelineDrag`, `kanAdd`, `addDeal`)
19. Contractor job board (`addNewJob`, `contAction`)
20. Contractor crew/contracts/invoicing (`switchContTab`: crew, contracts, jobs, invoice, clients, scout)
21. Invoice builder with line items + totals (`addInvoiceLine`, `initInvoiceCalc`, `updateInvoiceTotals`, `generateInvoice`)
22. Contract generation (AI-assisted) (`generateContractAI`)
23. Property manager portfolio/tenants/leases/maintenance/vacancy/financials tabs (`switchPMTab`)
24. Maintenance ticket system (`addMaintenanceTicket`)
25. Lease generator (`generateLease`)
26. Vacancy listing generator (`generateVacancyListing`)
27. Agent portal: buyers, listings, leads, comms, call-assist tabs (`switchAgentTab`)
28. Listings view (`buildListingsView`)
29. Notifications panel + push notifications (`renderNotifications`, `requestPushPermission`, `sendPushNotification`)
30. Command palette (`showCommandPalette`, `runPaletteCommand`)
31. Top 250 leaderboard/leads view (`renderTop250`, `sortTop250`, `top250Action`)
32. State/county coverage map (`buildStateCoveragePanel`, `showStateDetail`)
33. White-label / branding editor (`buildWhiteLabelEditor`, `applyBranding`, `previewBranding`)
34. Org/team management — create org, invite, join by token (`createOrg`, `createTeam`, `inviteTeamMember`, `joinTeamByToken`)
35. Presence bar (who's online) (`updatePresenceBar`, `updatePresenceInTeamsUI`)
36. Billing modal + usage meter + Stripe checkout (`openBillingModal`, `loadBillingUsage`, `v9StripeCheckout`)
37. Pricing grid / plan selector (`renderPricingGrid`, `selectPlan`)
38. API key management (Anthropic/Mapbox/Stripe) (`v9SaveKey`, `v9PromptAnthropicKey`, `v9PromptMapboxKey`, `generateApiKey`)
39. Env template export for self-hosting (`copyEnvTemplate`, `downloadEnvTemplate`)
40. Model manager / model switcher for AI calls (`renderModelManager`, `switchModel`, `autoSelectModel`)
41. RAG document ingestion + search ("knowledge base") (`ingestRAGDocument`, `searchRAG`, `buildRAGPanel`)
42. PDF text extraction + PDF export of deal analysis (`v9ExtractPDFText`, `v9ExportDealPDF`)
43. DocuSign-style document signing flow (`showDocSignModal`, `sendToDocuSign`)
44. Feedback widget + AI feedback logging (`submitFeedback`, `logAIFeedback`)
45. Star rating component (`setRating`, `hoverRating`)
46. Keyboard shortcuts panel (`toggleShortcuts`)
47. Dark/light theme toggle (`toggleTheme`)
48. PWA install prompt + manifest (`triggerPWAInstall`)
49. Prompt-injection detection/sanitization on AI inputs (`detectInjection`, `checkInjection`, `sanitizeForPrompt`) — genuinely worth keeping
50. Auth modal w/ Google/Apple sign-in stubs (`submitGoogleAuth`, `submitAppleAuth`)

*(There's a second, much larger layer beyond these 50 — an internal-only "SP6" admin/launch tool with ~100 of its own functions: sprint planner, pitch deck generator, financial model builder, architecture diagram generator, QA test runner, launch checklist, health dashboard, etc. This is a builder-facing meta-tool, not a beta-user-facing feature, and is called out separately below.)*

---

## Top 20 that matter for the current app (real-estate lead intelligence wedge)

1. Lead pool table with tag-based filtering (Vacant/Tax/Absentee/Probate/High-Equity)
2. Distress/opportunity scoring + visible score badge per property
3. Property detail page (owner, contact, status, score, history)
4. Rehab/repair estimate calculator
5. LOI / offer draft generator
6. Deal calculator (ARV, offer price, margin)
7. Comps finder
8. AI deal analysis ("why this lead is valuable or weak" — maps directly to a requested AI action)
9. AI-drafted outreach: SMS / email / call script (draft-only, matches the "no auto-send" rule)
10. Call-assist brief + objection handling (good AI Actions Panel content)
11. Pipeline/kanban board with drag-drop stage changes
12. Contractor job board (job postings + scope)
13. Comms hub / outreach inbox (threaded messages)
14. Skip trace action (contact discovery)
15. County records search + CSV export (source data acquisition)
16. Org/invite flow (create org, invite by token) — maps to invite-only beta requirement
17. Notifications panel
18. Command palette (quick actions, power-user nav)
19. Prompt-injection sanitization on AI inputs — should be adopted as a standard, not just a v9 idea
20. Map-based pin/deal finder (D4D) — lighter-weight version fits "Property Database" map view

---

## Top 10 to migrate first

1. **Lead pool table + filters** → `LeadTable` / `/leads`
2. **Distress/Opportunity score badge** → `DistressScoreBadge` (v67 already has `lib/scoring/engine.ts` — wire the badge to that, not to v9's cosmetic tag counts)
3. **Property detail / lead detail page** → `LeadDetailPanel`, `/leads/[id]`
4. **Repair estimate calculator** → `RepairEstimateBuilder`
5. **LOI/offer generator** → `OfferDraftBuilder`
6. **Deal calculator + comps** → folded into `LeadDetailPanel` / `PropertySummaryCard`
7. **AI deal analysis + AI outreach drafts (SMS/email/call script)** → `AIActionPanel`, all draft-only, human-approved
8. **Pipeline kanban** → `PipelineBoard` (v67 already has `app/(app)/pipeline/page.tsx` — extend, don't replace)
9. **Contractor job board** → `/contractors`, ties into Adrian/Burdette Built funnel
10. **Org invite flow** → `/admin/users`, invite-only beta gate

---

## Demo-only features to ignore (do not migrate, do not expose in beta UI)

- SP6 internal command-center/launch-readiness/sprint-planner/pitch-deck/financial-model toolset (builder-facing meta-tool, not user product)
- LangGraph/Neo4j graph simulation toys (`v9BuildLangGraph`, `v9BuildNeoGraph`, `v9RunLangGraphSimulation`)
- "Swarm" deployment visuals (`deploySwarm`, `swarmAction`, agent dot/status UI) — cosmetic, no real agents behind it in v9
- Top 250 leaderboard (vanity feature, no real ranking logic)
- White-label/branding editor — postpone, not core to lead-intel wedge
- DocuSign-style signing flow — stub only, no real e-sign integration in v9
- PDF/CSV export buttons that don't have real generators wired (most are stubs)
- Star ratings, keyboard-shortcut overlay, theme toggle — nice-to-have polish, not wedge-critical
- Auth modal with fake Google/Apple buttons — v67 already has real Supabase auth, don't regress

This matches the standing instruction to hide (not delete) universe/demo features — these simply shouldn't be migrated into the new build in the first place, so there's nothing to hide.

## Duplicates already present in v67

- Leads (`app/api/leads`, `/leads` route) — **exists**, has source tracking (`app/api/leads/sources`)
- Properties (`app/api/properties`) — **exists**
- Pipeline (`app/(app)/pipeline`) — **exists**, needs drag-drop + stage UI confirmed
- Scoring engine (`lib/scoring/engine.ts`, 304 lines) — **exists**, is the real distress/opportunity score logic (v9's score was cosmetic tag counts, not a real formula — v67's engine should be treated as source of truth)
- Feature flag system (`lib/featureFlags.ts`) — **exists**, already has a Supabase-backed `feature_flags` table + env-var fallback; just needs the new flag keys from Phase 5 added
- Admin invite manager (`components/AdminInviteManager.tsx`) — **exists**, likely already covers the org/invite flow v9 only mocked
- Command palette (`components/CommandPalette.tsx`) — **exists**

## Missing v67 features worth adding (genuinely new from v9)

- Repair/rehab estimate builder UI (no equivalent found in v67's current routes)
- LOI/offer draft builder UI
- AI Action Panel with a fixed menu of human-approved actions (summarize, research, draft SMS/email/call script, generate scope/estimate/LOI, suggest follow-up, flag missing data, explain value) — v67 has AI plumbing (`app/api/ai`, `app/api/claude`) but no single panel that exposes this exact action set
- Contractor job board UI
- Source-confidence badge (v9 didn't really have this either, but it's needed given `app/api/leads/sources` already tracks source data — this should be a new `SourceConfidenceBadge` component, not a v9 port)
- Call-assist script/objection-handling panel (useful for agents/investors doing outreach)

## Suggested component/page mapping

| v9 concept | v67 target |
|---|---|
| Lead pool table | `components/LeadTable.tsx` → `/leads` |
| Property detail modal | `LeadDetailPanel.tsx` + `PropertySummaryCard.tsx` → `/leads/[id]` |
| Distress tags | `DistressScoreBadge.tsx` (wired to `lib/scoring/engine.ts`) |
| Rehab calculator | `RepairEstimateBuilder.tsx` → `/estimates` |
| LOI generator | `OfferDraftBuilder.tsx` → `/offers` |
| AI deal analysis + drafts | `AIActionPanel.tsx` (draft-only, approval-gated) |
| Pipeline kanban | extend existing `app/(app)/pipeline/page.tsx` with `PipelineBoard.tsx` |
| Contractor job board | `/contractors` (new) |
| Comms hub | `OutreachDraftBox.tsx` (draft-only, no auto-send) |
| Org/invite flow | extend `AdminInviteManager.tsx` → `/admin/users` |
| Sector switcher | replaced by real role-based `UserRoleGate.tsx`, not a manual portal picker |

---

**Note on scope:** This report covers Phases 1–3 of the requested build plan
(inspect/classify, archive, feature extraction). Phase 4 (actually building
the 14 routes / 15 components against the live Supabase schema, running
`npm ci && npm run check && npm test && npm run build`, and a real git
commit/push) is a substantial engineering pass against your real repo and
credentials — see the handoff notes for why that's queued as a deliberate
next step rather than something to rush through blind.
