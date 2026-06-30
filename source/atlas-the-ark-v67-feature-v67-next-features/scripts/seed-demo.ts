#!/usr/bin/env tsx
/**
 * THE ARK — Demo Workspace Seed Script
 * Creates: Atlas Demo Organization + 2 Garden Center pilot project
 * Run: npm run seed:demo -- --user-id=<uuid>
 * Atlas Genesis Matrix LLC · Isaac Brandon Burdette, Sole Inventor
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedDemo(userId: string) {
  console.log(`\n◈ THE ARK — Demo Workspace Seed`)
  console.log(`Atlas Genesis Matrix LLC · Isaac Brandon Burdette`)
  console.log(`─────────────────────────────────────────────────\n`)

  console.log(`Seeding demo workspace for user: ${userId}`)

  // Call the DB function
  const { data, error } = await supabase.rpc('seed_demo_workspace', { p_user_id: userId })

  if (error) {
    console.error('Error seeding demo workspace:', error.message)
    process.exit(1)
  }

  console.log(`✓ Project created: ${data}`)

  // Also seed some trust events for the Trust Dashboard demo
  await supabase.from('trust_events').insert([
    { user_id: userId, event_type: 'project_created', description: '2 Garden Center project created', metadata: { source: 'seed' } },
    { user_id: userId, event_type: 'file_uploaded', description: '2 Garden Center Proposal.pdf uploaded', metadata: { source: 'seed' } },
    { user_id: userId, event_type: 'document_parsed', description: 'Document parsed and chunked', metadata: { source: 'seed' } },
    { user_id: userId, event_type: 'agent_run_completed', description: 'Document Summary Agent ran on Proposal.pdf', metadata: { agent: 'FC-21', credits: 5 } },
    { user_id: userId, event_type: 'task_suggestion_created', description: '8 task suggestions extracted', metadata: { count: 8 } },
    { user_id: userId, event_type: 'task_suggestion_approved', description: 'User approved 3 AI suggestions', metadata: { count: 3 } },
  ])

  // Create investor milestones — mark M1 achieved
  await supabase.from('investor_milestones').update({
    achieved: true,
    achieved_at: new Date().toISOString(),
    evidence_note: 'Demo workspace seeded and verified',
  }).eq('milestone_code', 'M01')

  console.log(`\n✓ Demo data seeded successfully!`)
  console.log(`\nProject: 2 Garden Center — Medical Tenant Improvement`)
  console.log(`Customer: Shannon Hill / Family Practice`)
  console.log(`Location: Broomfield, CO`)
  console.log(`\n5-minute demo flow:`)
  console.log(`  1. Open Dashboard → see empire status`)
  console.log(`  2. Navigate to Contractor Portal`)
  console.log(`  3. View 2 Garden Center project`)
  console.log(`  4. Run document summary on Proposal.pdf`)
  console.log(`  5. Extract and approve tasks`)
  console.log(`  6. View Kanban`)
  console.log(`  7. Ask LUKA: "What should I work on next?"`)
  console.log(`  8. Open Trust Dashboard`)
  console.log(`\n◈ Deploy: push to GitHub → connect Vercel → set env vars`)
  console.log(`  git push origin main --force\n`)
}

const userId = process.argv.find(a => a.startsWith('--user-id='))?.split('=')[1]

if (!userId) {
  console.error('Usage: npm run seed:demo -- --user-id=<uuid>')
  console.log('Get your user ID from Supabase Auth dashboard')
  process.exit(1)
}

seedDemo(userId)
