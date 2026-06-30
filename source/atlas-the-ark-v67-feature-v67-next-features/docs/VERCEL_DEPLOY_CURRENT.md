# ATLAS v67 — Vercel Deploy (CURRENT)

Status: CURRENT · Updated 2026-06-26 · Supersedes the Vercel sections of `DEPLOY.md`
(which references the old repo name `the-ark` and a stale "run schema.sql" step).
Owner: Isaac Brandon Burdette · Atlas Genesis Matrix LLC

This is the single source of truth for deploying the work on branch
`claude/magical-euler-k1uk4k` (Research Arena, Genesis SIMULATE, DB hardening,
Site Capture & Measurement Fusion).

---

## 1. Account / project identity

| Thing | Value |
|-------|-------|
| Vercel **team** | `nstallings-2570s-projects` |
| Vercel **team ID** | `team_0BZSp8HQZWzF9FhQV4Uz4Qmf` |
| GitHub **repo to connect** | `atlasmac73/atlas-the-ark-v67` (NOT the old `the-ark`) |
| **Branch** with all new work | `claude/magical-euler-k1uk4k` |
| Supabase project | `kjfwanpwzgcscgsdgekm` (ACTIVE_HEALTHY) |

> The exact Vercel **project name + production URL can't be read from the build
> environment** (the available Vercel tools don't list projects). Find it in the
> Vercel dashboard under team `nstallings-2570s-projects` → the project linked to
> repo `atlas-the-ark-v67` → Settings → Domains. A URL seen in old docs was
> `atlasdealnavpro13.vercel.app` (unconfirmed).

---

## 2. Already done — DO NOT REDO

- **All 8 Supabase migrations are applied** to live `kjfwanpwzgcscgsdgekm`
  (auth reconcile → autopoietic → tournament/research → security hardening →
  perf → site capture → storage). **Ignore `DEPLOY.md` step 4 (schema.sql).**
- **Storage bucket `site-captures`** created (private, owner/admin RLS).
- Repo is green: typecheck + lint + tests + `next build` all pass.

---

## 3. Build gate (important)

`vercel.json` build command is:
```
npm run check && npm test && npm run build
```
So **a deploy FAILS if tests fail.** They pass now (79/79). New dependency
`exifr` is in `package-lock.json` and installs via `npm ci` automatically.
Cron in `vercel.json`: `/api/heartbeat` every 15 min (Genesis) — needs `CRON_SECRET`.

---

## 4. Environment variables (Settings → Environment Variables; scope Production + Preview)

### Required
```
NEXT_PUBLIC_SUPABASE_URL=https://kjfwanpwzgcscgsdgekm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<Supabase → Settings → API — SECRET, server only>
ANTHROPIC_API_KEY=sk-ant-api03-...
CRON_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://<your-vercel-url>.vercel.app
ADMIN_EMAILS=atlasmac73@gmail.com,slisaac89@gmail.com
INVITE_SECRET=<openssl rand -hex 32>
```

### New / important for the features built this session
```
ANTHROPIC_MODEL_POWER=<valid current Opus id>      # judge, research, Genesis
ANTHROPIC_MODEL_DEFAULT=<valid current Sonnet id>  # repo fallbacks may be STALE
ANTHROPIC_MODEL_FAST=<valid current Haiku id>
OPENAI_API_KEY=sk-...        # OPTIONAL — unlocks GPT models in tournament bake-offs
REGRID_API_TOKEN=...         # OPTIONAL — unlocks the parcel connector in Site Capture
```
USGS / NAIP / Census / OSM connectors are **keyless** — no vars needed.

### Optional (existing features)
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_T2..T7`,
`NEXT_PUBLIC_MAPBOX_TOKEN`, `TWILIO_*`, `RESEND_API_KEY`, `SENTRY_DSN`,
`BATCH_SKIP_TRACE_KEY`.

---

## 5. Deploy steps

1. Confirm the Vercel project (team `nstallings-2570s-projects`) is connected to
   repo **`atlasmac73/atlas-the-ark-v67`**.
2. Set the env vars in §4 (Production **and** Preview scope).
3. Branch is pushed → Vercel auto-builds a **Preview deployment** for
   `claude/magical-euler-k1uk4k`. Use that preview URL to verify before merging.
4. When confident, merge to `main` → production deploy.
5. After deploy: **sign up once** with `atlasmac73@gmail.com` (the
   `handle_new_user` trigger provisions you as `owner`). New consoles:
   `/admin/research-arena` and `/admin/site-capture`; founder dash `/admin/godview`.

---

## 6. Post-deploy smoke checks

- `/admin/research-arena` → run a model bake-off (needs `ANTHROPIC_API_KEY`).
- `/admin/site-capture` → upload a geotagged photo → EXIF + enrichment + fuse.
- Genesis cron: `curl https://<url>/api/heartbeat -H "Authorization: Bearer <CRON_SECRET>"`.

---

## 7. Outstanding owner items

- Confirm/set the `ANTHROPIC_MODEL_*` ids to valid current models.
- Confirm env vars exist on the **correct** project (can't be read from here).
- Optional keys (`OPENAI_API_KEY`, `REGRID_API_TOKEN`) when those features are wanted.
