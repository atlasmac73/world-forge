# THE ARK — Known Limitations (Beta v65)

Last updated: June 2026

---

## Portals with Full Functionality

These work for all beta testers:

- ✅ **Empire Dashboard** — loads, shows subscription state, credit bar
- ✅ **Deal Navigator** — AI-powered distress scoring, dossier, LOI generation
- ✅ **Agent Lab** — run 25 God Squad agents, view history
- ✅ **Contractors** — contractor management portal
- ✅ **LOI Generator** — AI letter-of-intent generation
- ✅ **Comms Hub** — SMS in mock mode (real SMS after A2P 10DLC)
- ✅ **Market Intel** — market analysis portal
- ✅ **Trust Dashboard** — audit log and connector tracking
- ✅ **Settings** — user preferences
- ✅ **Admin** — owner/admin only: invites, feedback, flags, audit

---

## Portals Available But Incomplete

These are visible but show real data only with API keys configured:

- ⚠️ **Living Graph** — works in mock mode; full AI expansion needs ANTHROPIC_API_KEY
- ⚠️ **WorldForge** — works in mock mode; full AI generation needs ANTHROPIC_API_KEY
- ⚠️ **Genesis Engine** — visual shell; AI execution needs ANTHROPIC_API_KEY
- ⚠️ **NASDROP** — owner-only intelligence dashboard; some features need full DB seed
- ⚠️ **Cognitive Cockpit** — visual dashboard; live metrics need Supabase data
- ⚠️ **Investor War Room** — strategic dashboard; live deal data needs properties seeded

---

## Coming in v66 (Next Sprint)

- 🔜 **Skip Trace (A12-SPECTER)** — requires BatchSkipTracing.com API key
- 🔜 **AIN Heatmap** — requires Mapbox GL token + county assessor data feed
- 🔜 **Signal Stack** — real-time MLS webhooks
- 🔜 **Akashic Records** — document vault with pgvector search
- 🔜 **Skills Matrix** — 2,500+ agent skills browser

---

## Coming in v67+ (Future Sprints)

- 🔮 **Swarm Nexus** — LangGraph multi-agent orchestration
- 🔮 **Voice Agent** — Twilio Voice (post A2P 10DLC)
- 🔮 **Atlas Pay** — Stripe billing (price IDs need setup in Stripe Dashboard)
- 🔮 **Transmedia Universe** — Leon Therano franchise portal
- 🔮 **Franchise Console** — multi-location deployment (enterprise tier)
- 🔮 **Sovereign Vault** — encrypted data sovereignty

---

## Known Issues

1. **SMS is in mock mode** — messages are logged but not actually sent until Twilio A2P 10DLC registration completes (2-4 week process at twilio.com)

2. **Billing is disabled** — Stripe checkout and webhooks work technically, but no price IDs are configured. Set them up in Stripe Dashboard, then enable the `BILLING_ENABLED` feature flag.

3. **Skip Trace** shows "Coming Soon" — this is intentional until BatchSkipTracing API is integrated.

4. **AI features require ANTHROPIC_API_KEY** — without it, the app shows safe demo responses in all AI-powered portals.

5. **No file upload yet** — document processing (mammoth library is installed) will be connected in v66.

6. **Mobile layout** — functional but not optimized; desktop is the primary beta target.

---

## Performance Notes

- First AI response may be slow (cold start on Vercel serverless)
- Living Graph expansion generates 40 nodes and may take 5-8 seconds
- Large Supabase queries may be slow until proper indexes are added in production
