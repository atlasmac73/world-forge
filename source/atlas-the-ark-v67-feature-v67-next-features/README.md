# THE ARK — ATLAS Genesis Matrix OS v65

**Isaac Brandon Burdette, Sole Inventor · Atlas Genesis Matrix LLC · Saint Albans/Nitro, WV**

Private invite-only beta. Not open to the public.

## What This Is

THE ARK is a sovereign AI operating system for real estate intelligence, agent automation, and deal management — built for the West Virginia/Appalachian market and beyond. v65 includes 33+ portals, 255 agents, and a full invite-only beta infrastructure.

## Quick Start (Local Dev)

```bash
git clone <your-repo>
cd the-ark
cp .env.example .env.local
# Fill in .env.local with your real values
npm install
npm run dev
```

App runs at http://localhost:3000

## Docs

| File | Purpose |
|------|---------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Full Vercel + Supabase deployment steps |
| [BETA_LAUNCH_CHECKLIST.md](./BETA_LAUNCH_CHECKLIST.md) | Pre-launch checklist |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Schema migration order and RLS setup |
| [OWNER_SETUP.md](./OWNER_SETUP.md) | Bootstrap owner account |
| [TESTER_INVITE_INSTRUCTIONS.md](./TESTER_INVITE_INSTRUCTIONS.md) | How to invite beta testers |
| [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) | What doesn't work yet |
| [SECURITY_NOTES.md](./SECURITY_NOTES.md) | Security model |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | Admin SQL reference |

## Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Anthropic Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Payments**: Stripe (feature-flagged off in beta)
- **SMS**: Twilio (requires A2P 10DLC — mock mode active)
- **State**: Zustand + React Query
- **Styling**: Tailwind CSS + custom ATLAS design tokens
- **Deploy**: Vercel

## Legal

All intellectual property, code, design, trademarks, and concepts are exclusively owned by Isaac Brandon Burdette and Atlas Genesis Matrix LLC. Provisional patents filed March 29, 2026. All rights reserved.
