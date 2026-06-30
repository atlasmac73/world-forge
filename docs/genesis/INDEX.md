# Genesis Command Center — Integration Packet Index

Status: CURRENT (index only — the packet files below are FUTURE_SCOPE, not yet created)

This folder will hold the integration packet for the future "Genesis Command Center" product
module — a DB-backed roadmap/Kanban/100-idea-library/mind-map/patent-moat tool with a protected
`/genesis` route and an admin-only `/genesis/admin` route.

Do not confuse this with the existing **Genesis Cycle (A03 GENESIS)** agent — see
`docs/ATLAS_GLOSSARY.md`. They share a name only.

## Planned Packet (not yet written)

1. PRD.md — product requirements
2. DATA_MODEL.md — tables/schema for roadmap, Kanban, idea library, mind-map, patent-moat
3. SEED_DATA.md — initial idea-library/roadmap seed content
4. ADMIN_SECURITY.md — admin-only access rules, audit logging requirements
5. UI_SPEC.md — `/genesis` and `/genesis/admin` page specs
6. ACCEPTANCE_CHECKLIST.md — done-criteria for the module
7. FUTURE_ROADMAP.md — what's explicitly out of scope for v1
8. OWNERSHIP_IP_RULES.md — Isaac Brandon Burdette sole owner/founder/inventor of ATLAS / Atlas
   Genesis Matrix IP; no other person/entity listed as inventor (see `CLAUDE.md` §2 and
   `05_READ_FIRST/GOVERNANCE.md`)
9. ENV_VARS.md — `.env.example` names only; never real keys/secrets/tokens (hard rule)
10. (one more file, to be named when packet authoring starts)

## Claude Instruction

Do not start writing the packet files above, and do not start building the Genesis Command
Center feature itself (migrations, `/genesis` routes, admin panel), until the owner gives
explicit go-ahead — see `docs/ATLAS_CURRENT_PRIORITY.md` item 3 and `docs/ATLAS_OPEN_QUESTIONS.md`
item 3. When that approval comes, every packet doc must use `.env.example` variable names only —
never real passwords, API keys, Supabase service-role keys, Stripe keys, or Vercel tokens.
