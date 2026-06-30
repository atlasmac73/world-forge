# Plan 6 — Memory OS Plan
**ATLAS / THE ARK v67**
**Depends on:** 06_AUDIT/E (Database Inventory), G (Agent Inventory)

---

## 1. Thesis

"Memory OS" = giving ATLAS's agents and the Genesis Cycle durable, structured memory across
runs/cycles, beyond the per-run `agent_runs`/`agent_run_steps`/`agent_artifacts` records that
already exist. This audit did not find a dedicated cross-run "memory" subsystem distinct from
the existing run/artifact tables — this plan scopes what that would mean concretely rather than
assuming it already exists or needs to be built from nothing.

## 2. What Already Exists (Building Blocks, Not a Memory OS Yet)

- `agent_runs`, `agent_run_steps`, `agent_artifacts`, `agent_feedback` — per-run history,
  queryable, but not currently synthesized into any "what has this agent learned" representation.
- `prompt_versions` — versioned prompt templates (this is closer to "memory" in the sense of
  institutional knowledge about what prompts work, but it's manually versioned, not learned).
- Genesis Cycle's LEARN phase "records outcome, marks cycle complete" — this is the closest
  existing thing to a memory write, but it's scoped to the self-improvement loop, not to the
  5 real task agents (SPECTER/OMEN/HERALD/ORACLE/GENESIS itself).
- `genesis_mutations`, `selfbuild_tasks` — historical record of what's been proposed/attempted.

## 3. What's Missing for a Real "Memory OS"

- No confirmed mechanism for an agent (e.g. SPECTER doing a dossier) to retrieve "what did we
  learn about this property/owner/county last time" before starting a new run — each run
  appears to start fresh, relying only on what's passed in the request.
- No confirmed cross-agent shared knowledge store (e.g. something OMEN learns about a deal that
  SPECTER or HERALD could usefully reuse).
- No confirmed retrieval/embedding layer — `lib/models/` and `lib/agents/` as inventoried are
  request/response wrappers around Anthropic calls, not a RAG/vector-memory system.

## 4. Workstreams (Scoped, Not Yet Started)

### 4.1 Define Memory Scope First
- Before building anything, decide what "memory" should cover: per-property history,
  per-county trend memory, per-agent "lessons learned," or all three. This is a product
  decision the audit cannot make — flag to owner.

### 4.2 Property/County Memory (Likely Highest ROI)
- Given the existing `property_distress_scores`, `score_runs`, `distress_signals`,
  `ain_county_scores` tables already capture historical scoring data, the most concrete and
  lowest-net-new-schema path to "memory" is: have SPECTER/OMEN read prior `score_runs`/
  `distress_signals` for the same property/county before generating new output, and explicitly
  reference deltas ("this property's score rose from WARM to HOT since last scored"). This
  extends existing tables rather than creating a new memory subsystem — consistent with
  governance's "prefer extending existing systems."

### 4.3 Agent Lessons-Learned (Lower Priority, Higher Design Risk)
- A genuine "agent learns over time" system (e.g. feeding `agent_feedback` back into prompt
  selection) is a bigger lift and closer to the Genesis Cycle's MUTATE phase territory — if
  pursued, route any resulting prompt changes through `prompt_versions` (already exists) and
  treat any agent-behavior-changing update as subject to the same human-approval gate as other
  agent_update blueprint types, per `AUTOPOIETIC_LIMITS.HUMAN_APPROVAL_REQUIRED_TYPES`. Do not
  let agents silently self-modify their own prompts/behavior without that gate.

## 5. Explicit Non-Goals (Until Scoped)

- No vector database / embeddings infrastructure should be introduced speculatively — only
  scope this if Section 4.1's decision actually requires semantic retrieval beyond structured
  table queries.
- No agent should be able to change its own prompt/behavior without going through the existing
  human-approval blueprint gate — this is a direct extension of the standing Genesis/Autopoietic
  governance rule, applied explicitly to whatever "memory" ends up meaning.

## 6. Definition of Done

- Owner has confirmed memory scope (property/county, agent lessons-learned, or both).
- At minimum, SPECTER/OMEN demonstrably reference prior scoring history for the same property/
  county in new output (the concrete, low-risk first deliverable).
- Any agent-behavior-learning mechanism (if pursued) is gated through the existing approval flow.
