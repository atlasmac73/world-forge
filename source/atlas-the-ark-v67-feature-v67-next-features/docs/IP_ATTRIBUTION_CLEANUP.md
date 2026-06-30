# ATLAS — IP Attribution Cleanup
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Date:** June 18, 2026
**Status:** REQUIRED before any public/investor-facing deployment

---

## Correct Attribution (Production Standard)

**Sole Founder, Owner, and Inventor:**
Isaac Brandon Burdette
Atlas Genesis Matrix LLC
Saint Albans / Nitro, West Virginia

**Patent Portfolio:**
P001–P100 (OMNIFOLD™ patent family)
Non-provisional filing deadline: March 29, 2027
Priority patents: P001 (Genesis Cycle), P003 (SPECTER), P019 (Base Reality Recording)

---

## Nalone (Nas) Stallings — Correct Scope

Nalone Stallings may be accurately referenced only for:
- WV operations support and coordination
- Atlas Management & Construction LLC (separate LLC he owns)
- Build support on specific WV construction projects
- Ground-level project work in the WV market

Nalone Stallings is NOT:
- A co-inventor of Atlas Genesis Matrix IP
- A co-founder of Atlas Genesis Matrix LLC
- A named inventor on any ATLAS patent application
- A stakeholder in THE ARK platform IP
- An appropriate name in investor-facing "founding team" copy for Atlas Genesis Matrix

**Action required:** Review any auto-generated or old copy that implies co-invention and correct it.

---

## Adrian Burdette — Correct Scope

Adrian Burdette (Isaac's brother, owns Burdette Built LLC, Denver CO) may be referenced for:
- Construction estimating work under Burdette Built
- Specific project work (e.g., 2 Garden Center, Broomfield CO)
- Professional construction context

Not a co-inventor of ATLAS IP.

---

## Files to Audit Before Public Launch

| File | Issue | Status |
|------|-------|--------|
| `app/(marketing)/page.tsx` | Check founding team section | TODO |
| `app/(marketing)/manifesto/page.tsx` | Must use Isaac sole-founder copy | TODO |
| `app/(marketing)/pricing/page.tsx` | Company attribution in footer | TODO |
| `README.md` | Check attribution section | TODO |
| Any stakeholder deck copy pasted into app | Check for co-founder language | TODO |
| `docs/ATLAS_EVOLUTION_ARCHIVE.md` | Historical accuracy only, not legal claims | TODO |

---

## Required Language (Use This)

```
Atlas Genesis Matrix LLC
Sole Founder and Inventor: Isaac Brandon Burdette
Saint Albans, West Virginia

All intellectual property, including the ATLAS OS architecture,
THE ARK platform, Genesis Engine, SPECTER skip trace system,
AIN county intelligence network, OMNIFOLD™ patent portfolio (P001-P100),
and all agent systems, are the sole property of Isaac Brandon Burdette
and Atlas Genesis Matrix LLC.

Patent Pending — Non-provisional applications on file.
```

---

## Legacy File Handling

Old source packages (v1–v65) may contain inaccurate attribution from earlier
collaborative drafts. When displaying version history:

- Display version history as informational/archival only
- Do not import old "founding team" sections into production UI
- Correct any attributed invention claims before public exposure

Old files may be kept in `archive/` or `docs/` as internal reference only.
Never route them as public API responses or marketing pages.

---

## Checklist Before Any Public Launch

- [ ] `/manifesto` page uses correct sole-inventor copy
- [ ] Landing page founding section correct
- [ ] Pricing page footer correct
- [ ] README.md attribution correct
- [ ] `package.json` description correct (currently: "Isaac Brandon Burdette, Sole Inventor" ✅)
- [ ] No old co-founder language in any API response
- [ ] Patent pending statement on all public pages
- [ ] No claim of features not yet built
- [ ] No claim of "production" before actual production deployment
