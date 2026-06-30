# THE ARK — QA Checklist
## Atlas Genesis Matrix LLC · Isaac Brandon Burdette, Sole Inventor
## Part E-009 Section 25-29

---

## CORE APP QA

- [ ] User can sign up
- [ ] User can sign in
- [ ] User can sign out
- [ ] User can create organization
- [ ] User can create workspace
- [ ] User can create project
- [ ] User can create contact
- [ ] User can create task
- [ ] User can move task on Kanban
- [ ] User can upload file
- [ ] User can view file list
- [ ] User can parse supported document
- [ ] User can search project context
- [ ] User can open search result with evidence
- [ ] User can view project activity
- [ ] User can open Trust Dashboard

**Pass: core product loop works without developer intervention**

---

## GOOGLE CONNECTOR QA

- [ ] User can open connector setup
- [ ] User sees plain-language scope explanation
- [ ] User can start OAuth flow
- [ ] OAuth callback succeeds
- [ ] Connector appears in Trust Dashboard
- [ ] Gmail picker loads
- [ ] User can import selected Gmail message
- [ ] Drive picker loads
- [ ] User can attach Drive file
- [ ] Calendar picker loads
- [ ] User can attach calendar event
- [ ] Connector activity appears in audit log
- [ ] User can REVOKE connector
- [ ] Revoked connector BLOCKS new imports
- [ ] Existing imported records remain visible after revocation
- [ ] Trust Dashboard explains revocation vs deletion

**Pass: Google connector is selective, read-only, visible, revocable**

---

## DOCUMENT INGESTION & SEARCH QA

- [ ] PDF upload works
- [ ] PDF text extraction works for selectable-text PDF
- [ ] Scanned PDF fails safely (no crash)
- [ ] DOCX extraction works
- [ ] TXT extraction works
- [ ] Unsupported file stores safely
- [ ] Document chunks are created after parse
- [ ] Search finds phrase from document
- [ ] Search returns snippet with context
- [ ] Search respects project_id scope (no cross-project leak)
- [ ] Search result opens source file
- [ ] Document Summary Agent uses document text

**Pass: files become searchable project context without unsafe leakage**

---

## AGENTS & WORKFLOWS QA

- [ ] Document Summary Agent runs
- [ ] Document Summary output validates as JSON
- [ ] Task Extraction Agent runs
- [ ] Task suggestions shown for approval — NOT created automatically
- [ ] Approved tasks appear on Kanban
- [ ] Project Briefing Agent runs
- [ ] Daily Briefing Agent runs
- [ ] Recommendation cards are created
- [ ] Agent runs appear in Agent Run History
- [ ] Evidence Drawer shows source snippets
- [ ] Agent feedback can be submitted
- [ ] Document-to-task workflow runs
- [ ] Email-to-task workflow runs
- [ ] Customer update draft workflow runs
- [ ] No external messages sent automatically

**Pass: AI creates useful output, user remains in control**

---

## TRUST & SECURITY QA — CRITICAL

- [ ] Trust Dashboard loads
- [ ] Connected accounts appear
- [ ] Connector revocation works
- [ ] Agent runs appear
- [ ] Audit logs appear
- [ ] Memory controls work
- [ ] No tokens visible in UI
- [ ] No secrets visible in error messages
- [ ] No hidden prompt text shown to normal users
- [ ] AI disclaimer visible
- [ ] Known limitations page exists

### CRITICAL SECURITY QA (P0 — pilot blocks if any fail)

- [ ] **User A CANNOT see User B workspace data**
- [ ] **User A CANNOT search User B workspace**
- [ ] **User A CANNOT open User B file (signed URL check)**
- [ ] **User A CANNOT use User B connector**
- [ ] **Agent CANNOT use unauthorized document as context**
- [ ] **Search CANNOT return unauthorized chunks**
- [ ] **Service role key NOT exposed in browser**
- [ ] **Google client secret NOT exposed in browser**
- [ ] **Connector tokens NOT in audit logs or error messages**

**Pass: no cross-workspace leak, no token leak, no agent permission bypass**

---

## PILOT GO/NO-GO CRITERIA (Part E-008 Section 49)

### Pilot CAN begin when:

- [ ] Auth works
- [ ] Workspace isolation works (RLS confirmed)
- [ ] Project workspace works
- [ ] File upload works
- [ ] Document parsing works for basic files
- [ ] Search works and is scoped
- [ ] Google connector connects and revokes
- [ ] Document summary works
- [ ] Task extraction works with approval gates
- [ ] Trust Dashboard works
- [ ] Audit logs populated
- [ ] No known cross-workspace leaks
- [ ] No known token exposure
- [ ] Known limitations page exists and is visible
- [ ] Feedback capture mechanism exists

### Pilot MUST NOT begin if:

- [ ] Users can see other workspace data
- [ ] Connector tokens may leak to client
- [ ] Revocation does not block new imports
- [ ] Agent can create tasks without user approval
- [ ] Search leaks cross-workspace data
- [ ] File signed URLs can be accessed without auth
- [ ] Trust Dashboard missing
- [ ] Audit logs missing

---

## RELEASE CHECKLIST

- [ ] `npm run check` passes (typecheck + lint)
- [ ] Production build succeeds (`npm run build`)
- [ ] All 4 Supabase schemas applied in order
- [ ] RLS enabled on all workspace tables
- [ ] Storage bucket `project-files` is PRIVATE
- [ ] All Vercel environment variables set
- [ ] Google OAuth redirect URLs correct
- [ ] Supabase auth redirect URLs correct
- [ ] Stripe webhook configured (after Stripe setup)
- [ ] Twilio webhook configured (after A2P 10DLC approval)
- [ ] Demo workspace seeded (`seed_demo_workspace()`)
- [ ] Founder can complete full demo end-to-end

---

## LEGAL DECLARATION
All code, architecture, and IP: **Isaac Brandon Burdette, Atlas Genesis Matrix LLC**
Patent deadline: **March 29, 2027** (P001, P003, P019 priority)
