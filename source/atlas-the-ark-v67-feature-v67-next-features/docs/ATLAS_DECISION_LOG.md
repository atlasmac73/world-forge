# ATLAS Decision Log

Status: CURRENT

Append-only log of real decisions made by the owner, newest first. Don't edit past entries;
add new ones. This is for *decisions*, not status updates — for status, see
`docs/ATLAS_BUILD_LOG.md`.

## Log

### 2026-06-25 — Owner override: build AI Tournament + Research Notebook now; complete Genesis SIMULATE
Owner (Isaac) explicitly lifted the v67 scope fence on three items previously deferred in
`docs/DO_NOT_BUILD_YET.md`: the AI/model **tournament / self-eval**, deeper **Genesis** work, and
a **NotebookLM-style research** surface. Decision: build them as one unified, founder/admin-only
system rather than four disconnected features.

- The **tournament engine** (`lib/tournament/`) is the shared scoring layer. It ranks competing
  models (bake-off), ATLAS agent personas (contest), and Genesis blueprints (self-eval).
- It now backs the **Genesis SIMULATE** phase — replacing the documented stub with real
  LLM-judged blueprint scoring. The PROMOTE human-approval gate is **unchanged**: SIMULATE only
  scores/ranks, it never promotes or deploys. Genesis stays human-gated and admin-only.
- The **Research Notebook** (`app/api/research/*`) does grounded Q&A over a curated source set
  (context-stuffing, **not** a vector DB — the RAG-layer deferral in CLAUDE.md §10 still holds)
  and can route answers through the tournament.
- **Graceful degradation, no fake success:** bake-offs run on whatever providers have keys.
  Anthropic is always live; OpenAI activates when `OPENAI_API_KEY` is set; other providers report
  UNAVAILABLE and are skipped (surfaced in the run's `skipped` list) rather than mocked.
- Google Drive / NotebookLM ingestion is a gated adapter (`source_type` `google_drive`/`url`):
  schema + UI accept it, but until the OAuth connector is wired the caller must supply content
  directly — we never fabricate fetched content.

Still OUT (deferred): autonomous/self-deploying Genesis, code auto-merge, a real vector/RAG layer,
live OAuth connectors, and exposing any of this to beta users.

### 2026-06-21 — Keep `organizations` table in the v67/master (T1–T7) shape
Two incompatible `organizations` table definitions exist across schema files
(`schema_pilot.sql` vs `schema_v67_master.sql`). Decision: keep the v67/master shape
(`owner_id`/`plan_code`, T1–T7 tiers) since the app is moving toward the tier system. Live DB
confirmed empty of an `organizations` table at decision time (Case A — clean slate, no migration
of existing data required). `schema_pilot.sql`'s conflicting block is to be skipped/patched when
applying schema, not merged.

### 2026-06-21 — Memory OS build order: Level 1 then Level 2, stop before Level 3
Built root `CLAUDE.md` (Level 1 router) and the `05_READ_FIRST/`, `06_AUDIT/`, `07_PLANS/`
folder indexes plus core `docs/ATLAS_*.md` files (Level 2 wiki). Explicitly not building Level 3
(semantic search), Level 4 (knowledge graph), or Level 5 (always-on autonomous brain) without
separate approval.

### 2026-06-21 — Access model: ask-before-action, not blanket-grant
Owner wants to avoid manual key copy/paste but does not want to grant unrestricted, permanent
access. Decision: scoped GitHub token excluding delete/admin permissions where possible; for
Vercel/Supabase, protection is procedural (ask before destructive actions) rather than
token-enforced, since those platforms don't offer the same fine-grained scoping via CLI login.

### 2026-06-21 — Privacy posture: private/invite-only everywhere, for now
GitHub repo, Vercel project, and Supabase project are all to remain private/invite-only. Nothing
made public without a separate explicit decision.

## Claude Instruction

When you make or are told to make a decision with lasting effect (not just a one-off task),
add an entry here. Keep entries short — link to the relevant audit/plan file for detail rather
than re-explaining it.
