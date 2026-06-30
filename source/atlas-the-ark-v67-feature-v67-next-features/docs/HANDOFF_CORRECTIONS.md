# ATLAS v67 — Master Handoff Corrections (CANONICAL)

Status: CURRENT · 2026-06-26 · Corrects `ATLAS_v67_MASTER_HANDOFF` snapshots.
Owner: Isaac Brandon Burdette · Atlas Genesis Matrix LLC

The master handoff doc is accurate on architecture/features, but three facts in
the snapshots were stale or wrong. These are the authoritative values.

## The 3 corrections

1. **Test count.** Snapshots say "79/79". Current = **152 tests passing** (+ the
   field-trial additions below). Breakdown: original 79 → +52 (reviewer RBAC +
   async-billing suites) → +21 (Genesis safety-gate suites) → + custom-object tests.

2. **Repository name (important).** Snapshots/continuation prompt say
   `atlasmac73/the-ark`. The **actual repo is `atlasmac73/atlas-the-ark-v67`**.
   A continuation agent following the old name targets the wrong repo. The Vercel
   team (`nstallings-2570s-projects`, `team_0BZSp8HQZWzF9FhQV4Uz4Qmf`) and Supabase
   project (`kjfwanpwzgcscgsdgekm`) are correct.

3. **Live status.** Still **not verified end-to-end live**: `auth.users` is empty
   (owner must sign up), and the sandbox blocks the external connectors (they run in
   the Vercel deploy, untested from the build env). Canonical branch =
   **`claude/magical-euler-k1uk4k`** — it is byte-for-byte intact and is the single
   source of truth (a separate account's `build/test-ready` diverged and is not on
   this remote; do not treat it as canonical).

## Field-trial builds added this pass (for Field Trial #001)

- **Custom known-object** — enter any reference object (e.g. "24×24 marker board",
  size + in/ft/m + pixel spans) as a scale anchor. (`custom_object` observation;
  `constraintFromCustomObject` in fusion.)
- **LiDAR / scan asset upload** — ingest now accepts `.usdz/.obj/.ply/.glb/.gltf/
  .zip/.pdf`, classifies them (`lidar_scan`/`document`), stores the bytes, and
  badges them in the UI (EXIF parsing skipped for non-images).
- **New known-object anchors** — 4-ft level (48in), 2-ft level, tape 1-ft span,
  fence panel 6ft/8ft, CMU 8in — all selectable in the measurement panel.

Validation at this pass: typecheck clean, build OK, full suite green (see commit).
