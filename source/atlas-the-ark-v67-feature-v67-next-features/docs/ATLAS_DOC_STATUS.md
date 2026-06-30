# ATLAS Doc Status

Status: CURRENT

Status labels used across this repo's docs, and what they mean. Every doc that matters should
carry one of these at the top.

## Labels

| Label | Meaning |
|---|---|
| CURRENT | Accurate as of last verification; trust it, but re-verify against code if something looks stale. |
| SOURCE_OF_TRUTH | The single authoritative doc for its topic; other docs should link here, not restate. |
| DRAFT | Not yet verified/approved; treat as a proposal, not fact. |
| SUPERSEDED | Replaced by a newer doc — kept for history only. Don't act on it. |
| LEGACY | Describes a system still present in the repo but being phased out (e.g. legacy SPA shell). |
| REFERENCE_ONLY | Historical report/snapshot (e.g. old `V67_*` and `PHASE_*` reports in `docs/`); useful context, not a current-state claim. |
| FUTURE_SCOPE | Describes planned, not-yet-built work. |
| DO_NOT_BUILD_YET | Explicitly paused pending owner approval — see `CLAUDE.md` §10 and `docs/DO_NOT_BUILD_YET.md`. |

## Where Status Lives

- `05_READ_FIRST/`, `06_AUDIT/`, `07_PLANS/`, and the core `docs/ATLAS_*.md` files: CURRENT
  (as of last update; see each `INDEX.md`).
- `docs/genesis/INDEX.md`: CURRENT as an index, but the packet files it indexes are FUTURE_SCOPE
  (not yet created).
- Most other `docs/V67_*.md`, `docs/PHASE_*.md` historical reports: REFERENCE_ONLY unless a
  specific doc says otherwise — these were snapshots from prior merge/audit passes, not living
  docs.

## Claude Instruction

If you create or substantially rewrite a doc, give it a status label. If you find a doc with no
label, don't assume CURRENT — check it against the code first.
