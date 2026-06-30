# G. Agent Inventory
**ATLAS / THE ARK v67**

---

## 1. Real, Implemented Agents

| Code | Name | File | Function |
|---|---|---|---|
| A01 | ORACLE | inline in `lib/agents/toolGateway.ts` | Orchestrator / streaming copilot |
| A03 | GENESIS | `lib/autopoietic/heartbeat.ts` + `/api/genesis/cycle` | Self-improvement Genesis Cycle (6-phase) |
| A06 | HERALD | `lib/agents/copywriter.ts` | Outreach copywriting |
| A12 | SPECTER | `lib/agents/investigator.ts` | Property investigation / dossier generation |
| A15 | OMEN | `lib/agents/underwriter.ts` | Underwriting / MAO analysis |

## 2. Registered-But-Stub Agents

| Code | Name | Status |
|---|---|---|
| A13 | VANGUARD | TOOL_REGISTRY entry only (market heatmap) — no implementation file |
| A25 | ZEUS | TOOL_REGISTRY entry only (swarm/god squad) — no implementation file. Note: "ZEUS PR automation" is also referenced as a *future* GitHub integration concept in `V67_DEPLOYMENT_HOLD.md` — explicitly NOT to be built yet. These are likely the same future-roadmap item, not yet started in any form. |
| A228 | UNREAL | TOOL_REGISTRY entry only (world generation) — no implementation file |

Total agent codes referenced in `TOOL_REGISTRY`: 14 tools across these agent codes plus
additional tool-only entries that don't map to a standalone agent identity.

Note: prior session context referenced "230 unseeded agents" as a number associated with the
broader agent-roster ambition (Agent Workforce concept) — this figure refers to the aspirational
roster size from earlier planning material, not 230 currently-stubbed code paths in this repo.
Treat it as a Plan 7 (Agent Workforce) input, not a G-inventory finding.

## 3. Tool Gateway Execution Pattern

```
lib/agents/toolGateway.ts
Auth → Tier Gate (TOOL_REGISTRY minimum tier vs caller's subscription tier)
     → Credit Gate (subscriptions.credits vs tool's credit cost, 2–50 range)
     → Execute (dispatch to the agent implementation)
     → Log (agent_runs row + audit_logs row)
```

## 4. Genesis Cycle Agent (A03) — Special Case

A03-GENESIS is architecturally different from the other 4 real agents: it does not respond to a
single user request, it runs a 6-phase batch process (SENSE→INTERPRET→MUTATE→SIMULATE→
PROMOTE→LEARN) against platform-wide metrics, gated by the triple-safety design documented in
B. Architecture Map. It is the only agent capable of proposing changes to the platform itself
(via `build_blueprints`), which is why it carries the strictest approval requirements
(`HUMAN_APPROVAL_REQUIRED_TYPES` always includes its most sensitive output types).

## 5. Model Assignment Per Agent

All 5 real agents resolve their model via `lib/models/router.ts`'s `TaskType` × tier-band
mapping (not via `lib/models/registry.ts`, which is display-only). Tier bands: T1–T2 → low
(claude-fast/haiku), T3–T4 → mid (claude-default/sonnet), T5–T7 → high (claude-power/opus).
Each `TaskType` (realestate, dossier, underwriting, copywriting, scoring, skip_trace, rehab,
chat, summary, code, reasoning, speed) is mapped independently of agent identity, so the same
agent could route to different models depending on the caller's task type and tier.

## 6. Kill Switch Coverage

Confirmed checked in all agent-execution routes (`/api/agents/run`, `/api/agents/distress-
score`, `/api/agents/document-summary`, `/api/agents/dossier`, `/api/agents/loi`, `/api/agents/
skip-trace`, `/api/agents/task-extraction`) plus inside `runHeartbeatTick()` for A03-GENESIS.
This is complete coverage for all 5 real agents.

## 7. Gaps / Recommendations

- 3 stub agents (VANGUARD, ZEUS, UNREAL) exist only as registry metadata — if surfaced in any
  UI as "available," that would be a false claim to users. Confirm no UI currently lists them
  as usable (flagged for Plan 1 verification pass).
- No agent currently has an automated, scheduled execution path other than the manually-
  triggered Genesis Cycle — all other agents are purely request/response, triggered by direct
  user action through the Tool Gateway. This matches the intended design (no autonomous
  unattended agents) and should be preserved going forward per governance.
