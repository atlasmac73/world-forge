# Deal Navigator Pro v9.0 — Legacy Prototype

**Status: ARCHIVED. Reference only. Not deployed. Not linked from any route.**

## What this is

This is the original single-file HTML prototype ("Deal Navigator Pro v9.0 —
ATLAS Real Estate Intelligence Portal", saved from `DealNavigatorPro_v9_3.html`).
It is a self-contained, client-side-only demo (~21,800 lines, ~1.4MB) with no
backend, no real persistence (uses `localStorage`/IndexedDB stubs), and no
auth. All data shown in it is fabricated demo data.

It is kept here purely as a **product/spec reference** — a catalog of ideas,
workflows, and UI patterns that informed the real-estate lead intelligence
module now being built into the production Next.js app (`v67`).

## What it is NOT

- It is **not** the production app.
- It is **not** wired to Supabase, Anthropic, Twilio, Stripe, or any real API.
- It must **not** be deployed, linked, iframed, or served from any route in
  the v67 app.
- Nothing in it should be treated as a finished feature — treat every screen
  as a mockup.

## Why it's here

Isaac asked that the v9 prototype not be lost or silently discarded, but
also not be mistaken for shippable product. See
`docs/V9_FEATURE_EXTRACTION_REPORT.md` (or the equivalent report delivered
alongside this archive) for the breakdown of what was extracted from this
file into the real app, and what was deliberately left behind as demo-only
lore (robot fleets, drones, Akashic records, world builder, simulation
lore, autonomous Genesis cycles, etc.).

## If you need to open it

It's a plain HTML file — open it directly in a browser. There is nothing to
build or install. Do not add it to any `next.config.js` rewrites, do not
import it into the app router, and do not reference it from
`app/(marketing)` or `app/(app)`.
