# THE ARK — Production SaaS Roadmap

**Post-Beta v66+ Backlog**
Isaac Brandon Burdette, Sole Inventor — Atlas Genesis Matrix LLC

---

## Priority 1: Revenue Infrastructure (v66 Sprint)

### Stripe Billing Completion
- [ ] Create Stripe products and price IDs for all 7 tiers (T1-T7)
- [ ] Add price IDs to Vercel env vars
- [ ] Enable `BILLING_ENABLED` feature flag
- [ ] Test full checkout → webhook → subscription update flow
- [ ] Add upgrade/downgrade flow in Settings portal
- [ ] Add billing portal (Stripe Customer Portal redirect)

### Credit Metering
- [ ] Increment `credits_used_today` on every AI call
- [ ] Add daily cron to reset `credits_used_today` at midnight UTC
- [ ] Return 429 when user exceeds `credits_limit_daily`
- [ ] Add credit purchase add-on flow

### Subscription Access Control
- [ ] Read tier from `subscriptions` table on all AI routes
- [ ] Gate expensive models (claude-opus) behind T5+
- [ ] Gate portal access by tier (AIN = T2+, NASDROP = T7)
- [ ] Add upgrade prompt when user hits tier limit

---

## Priority 2: Data & AI (v66 Sprint)

### Skip Trace Integration
- [ ] BatchSkipTracing.com API integration
- [ ] Store results in `leads` table with skip trace data
- [ ] A12-SPECTER agent implementation

### AIN Heatmap
- [ ] Mapbox GL integration with county-level overlays
- [ ] WV county assessor data ingestion pipeline
- [ ] Distress score heatmap layer

### Document Processing
- [ ] File upload via Supabase Storage
- [ ] mammoth.js Word doc extraction (installed, not wired)
- [ ] PDF processing with pdf-parse
- [ ] Vector embeddings via pgvector (schema ready, not populated)
- [ ] RAG search across user documents

### Living Graph — Full Mode
- [ ] Persist graph nodes to `graph_nodes` table
- [ ] Save/load graph sessions
- [ ] Graph diff / history
- [ ] Share graph with team members

---

## Priority 3: Security Hardening (v66-v67)

- [ ] Add Sentry error tracking (frontend + API)
- [ ] Add Vercel WAF
- [ ] Rate limiting at edge (middleware, not just in-memory)
- [ ] IP allowlisting for admin routes
- [ ] Supabase PITR (backup)
- [ ] Full RLS audit
- [ ] Penetration test before public launch
- [ ] SOC2 Type I readiness review

---

## Priority 4: Comms & Connectors (v67)

### Twilio A2P 10DLC
- [ ] Complete A2P 10DLC registration (2-4 weeks)
- [ ] Enable `SMS_ENABLED` feature flag
- [ ] Activate SMS campaigns in Comms Hub
- [ ] Add Voice Agent (Twilio Voice + WebSockets)

### OAuth Connectors
- [ ] Google OAuth (Sheets, Drive, Gmail)
- [ ] MLS data connector
- [ ] PropStream API connector
- [ ] BatchSkipTracing connector
- [ ] n8n webhook connector

---

## Priority 5: Observability (v67)

- [ ] Sentry error tracking
- [ ] Vercel Analytics (already available)
- [ ] Custom admin dashboard: active users, AI cost, error rate
- [ ] Supabase AI usage dashboard
- [ ] Stripe revenue dashboard
- [ ] AI cost per user metering

---

## Priority 6: Legal & Compliance (Before Public Launch)

- [ ] Privacy Policy page (`/privacy`)
- [ ] Terms of Service page (`/terms`)
- [ ] Cookie consent banner
- [ ] CCPA/GDPR data deletion endpoint (`/api/user/delete`)
- [ ] Data export endpoint (`/api/user/export`)
- [ ] TCPA compliance documentation for SMS
- [ ] Patent prosecution (P001-P100 provisional → non-provisional)

---

## Priority 7: Platform Expansion (v68+)

- [ ] Swarm Nexus — LangGraph multi-agent orchestration
- [ ] Franchise Console — multi-location ARK deployment
- [ ] Sovereign Vault — encrypted data sovereignty layer
- [ ] WorldForge full mode — 3D Three.js scene rendering
- [ ] Transmedia Universe — Leon Therano portal
- [ ] Mobile app (React Native or PWA)
- [ ] Skills Matrix — 2,500 agent skills browser

---

## Milestones

| Milestone | Target | Trigger |
|-----------|--------|---------|
| **Beta v65** | Now | 10-25 invite-only users |
| **v66 Revenue** | 4 weeks | Stripe + skip trace + AIN live |
| **v67 Comms** | 8 weeks | A2P 10DLC approved, connectors live |
| **v68 Scale** | 12 weeks | 100+ users, observability live |
| **Public Launch** | 16 weeks | Legal pages, security audit, load test |

---

## Production Acceptance Criteria

Not production-ready until ALL of these are true:

- [ ] Billing is real, tested, and charges correctly
- [ ] Subscription tier controls feature access
- [ ] AI usage is metered and billed
- [ ] Rate limits enforced at the edge
- [ ] All user data protected by RLS (audited)
- [ ] Error tracking capturing 100% of 500 errors
- [ ] Audit logs complete for all sensitive actions
- [ ] Legal pages live (Privacy, Terms)
- [ ] Data deletion/export works
- [ ] Admin can monitor users, costs, errors in real-time
- [ ] E2E Playwright tests pass
- [ ] Load test: 100 concurrent users, p95 < 2s
- [ ] No demo-only portals presented as finished
