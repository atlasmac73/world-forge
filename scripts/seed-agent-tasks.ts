/**
 * seed-agent-tasks.ts
 * Seeds the agent_tasks table with the real v66 build backlog.
 * Run: npx tsx scripts/seed-agent-tasks.ts
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TASKS = [
  // ── CRITICAL BLOCKERS (priority 90–100) ──
  { title: 'Rotate leaked Anthropic API key', description: 'Old key was exposed in .txt files. Create new key at console.anthropic.com → paste into Vercel env vars.', type: 'infra', priority: 100, effort: 'tiny', source_agent: 'FC-01', target_portal: 'admin', assigned_to: 'isaac', sprint: 1, tags: ['security','blocker','deploy'] },
  { title: 'Add SUPABASE_SERVICE_ROLE_KEY to Vercel', description: 'Grab from Supabase Dashboard → Settings → API → service_role. Paste into Vercel project environment.', type: 'infra', priority: 99, effort: 'tiny', source_agent: 'FC-01', target_portal: 'admin', assigned_to: 'isaac', sprint: 1, tags: ['deploy','blocker','env'] },
  { title: 'Set ANTHROPIC_API_KEY in Vercel env', description: 'Single key unlocks 6 portals at once: Deal Nav, Agent Lab, LOI, Living Graph, WorldForge, Genesis.', type: 'infra', priority: 98, effort: 'tiny', source_agent: 'FC-01', target_portal: 'admin', assigned_to: 'isaac', sprint: 1, tags: ['deploy','blocker','env','ai'] },
  { title: 'Deploy v66 to Vercel under Isaac\'s account', description: 'Deploy from atlas-build folder. Use Isaac\'s personal Vercel — NOT Nas\'s team_9rztY6xv.', type: 'infra', priority: 97, effort: 'small', source_agent: 'A07-FORGE', target_portal: 'admin', assigned_to: 'isaac', sprint: 1, tags: ['deploy','vercel','blocker'] },
  { title: 'Push v66 to private GitHub repo', description: 'Required for Claude Code self-build loop. Private repo under atlasmac73. This is what coding agents read and write from.', type: 'infra', priority: 90, effort: 'small', source_agent: 'A07-FORGE', target_portal: 'admin', assigned_to: 'isaac', sprint: 1, tags: ['github','deploy','claude-code'] },

  // ── AI UNLOCK ──
  { title: 'Verify Deal Navigator AI scoring with live key', description: 'Test distress score endpoint with a real WV property address after API key is set.', type: 'feature', priority: 85, effort: 'tiny', source_agent: 'FC-21', target_portal: 'deals', assigned_to: 'claude-code', sprint: 1, tags: ['ai','deals','verification'] },
  { title: 'Verify 25 God Squad runs with live key', description: 'Run A01-ORACLE, A25-ZEUS, A15-OMEN against real tasks. Check audit_log for results.', type: 'feature', priority: 84, effort: 'tiny', source_agent: 'A01-ORACLE', target_portal: 'agents', assigned_to: 'claude-code', sprint: 1, tags: ['ai','agents','god-squad'] },

  // ── DATA SEEDING ──
  { title: 'Seed 10 real WV properties', description: 'NASDROP, Cognitive Cockpit, War Room all blocked on empty properties table. Use seed:demo or insert real WV addresses.', type: 'data', priority: 80, effort: 'small', source_agent: 'A15-OMEN', target_portal: 'nasdrop', assigned_to: 'isaac', sprint: 1, tags: ['data','seed','properties','wv'] },
  { title: 'Set stripe_price_id in subscription_tiers', description: 'subscription_tiers table exists, stripe_price_id is NULL. Create products in Stripe Dashboard → paste IDs.', type: 'infra', priority: 70, effort: 'small', source_agent: 'A03-GENESIS', target_portal: 'pay', assigned_to: 'isaac', sprint: 1, tags: ['stripe','billing'] },

  // ── PORTAL BUILDOUT ──
  { title: 'Build NASDROP portal — full intelligence dashboard', description: 'Currently 37-line stub. Needs: distress heat map, priority deal queue, owner intel feed, quick-action bar. DB schema + API routes exist.', type: 'feature', priority: 75, effort: 'medium', source_agent: 'A12-SPECTER', target_portal: 'nasdrop', assigned_to: 'claude-code', sprint: 1, tags: ['nasdrop','portal','v66'] },
  { title: 'Build Market Intel portal — county data + trends', description: 'Stub portal. county_economic_data has 20 live rows. Build: county selector, recharts trend charts, AIN overlay, comp pulls.', type: 'feature', priority: 72, effort: 'medium', source_agent: 'A15-OMEN', target_portal: 'market', assigned_to: 'claude-code', sprint: 1, tags: ['market','portal','charts','v66'] },
  { title: 'Build Skills Matrix portal — 2500+ agent skills browser', description: 'Stub portal. Needs: searchable skill browser, agent-to-skill mapping, tier filter, add-to-agent flow. registry/agents.yml is source of truth.', type: 'feature', priority: 65, effort: 'medium', source_agent: 'A20-FLUX', target_portal: 'skills', assigned_to: 'claude-code', sprint: 1, tags: ['skills','portal','v66'] },

  // ── HARVEST FROM v23 ──
  { title: 'Harvest skip-trace API route from v23', description: 'v23: app/api/skip-trace/route.ts (67-158 lines). Drop into v66, wire to A12-SPECTER. Needs BatchSkipTracing.com API key.', type: 'feature', priority: 68, effort: 'small', source_agent: 'A12-SPECTER', target_portal: 'skip-trace', assigned_to: 'claude-code', sprint: 1, tags: ['skip-trace','harvest','v23'] },
  { title: 'Harvest multi-model picker from v23', description: 'v23: lib/models/registry.ts (46 lines). Adds Ollama fallback + model selection to Agent Lab.', type: 'feature', priority: 55, effort: 'small', source_agent: 'A03-GENESIS', target_portal: 'agents', assigned_to: 'claude-code', sprint: 1, tags: ['models','harvest','v23'] },
  { title: 'Harvest Stripe checkout flow from v23', description: 'v23: app/api/stripe/checkout + upgrade page. Requires Stripe price IDs to be set first.', type: 'feature', priority: 60, effort: 'medium', source_agent: 'A03-GENESIS', target_portal: 'pay', assigned_to: 'claude-code', sprint: 2, tags: ['stripe','billing','harvest','v23'] },

  // ── EXTERNAL SIGNUPS ──
  { title: 'Register Twilio A2P 10DLC for real SMS', description: 'SMS routes exist + work. A2P 10DLC registration at twilio.com takes 2-4 weeks. Start today — it\'s just a form.', type: 'external', priority: 50, effort: 'small', source_agent: 'A06-HERALD', target_portal: 'comms', assigned_to: 'isaac', sprint: 1, tags: ['twilio','sms','a2p','external'] },
  { title: 'Create BatchSkipTracing.com account', description: 'Required for A12-SPECTER. Sign up at batchskiptracing.com, get API key, add as BATCH_SKIP_TRACE_KEY.', type: 'external', priority: 48, effort: 'tiny', source_agent: 'A12-SPECTER', target_portal: 'skip-trace', assigned_to: 'isaac', sprint: 1, tags: ['skip-trace','external','api-key'] },
  { title: 'Get Mapbox GL token for AIN Heatmap', description: 'AIN property heatmap needs Mapbox GL JS. Sign up at mapbox.com, add as NEXT_PUBLIC_MAPBOX_TOKEN.', type: 'external', priority: 45, effort: 'tiny', source_agent: 'A16-TEMPEST', target_portal: 'ain', assigned_to: 'isaac', sprint: 1, tags: ['mapbox','ain','external'] },

  // ── SELF-BUILD LAYER ──
  { title: 'Point Claude Code at the GitHub repo', description: 'Install Claude Code CLI (npm install -g @anthropic-ai/claude-code). Run: claude in atlas-build directory. This is your developer team.', type: 'infra', priority: 88, effort: 'tiny', source_agent: 'A03-GENESIS', target_portal: 'build', assigned_to: 'isaac', sprint: 1, tags: ['claude-code','self-build','setup'] },

  // ── V67 FUTURE ──
  { title: 'Build Swarm Nexus — LangGraph multi-agent orchestration', description: 'Agents collaborate on complex deals via graph execution. Requires LangGraph.js integration.', type: 'feature', priority: 35, effort: 'epic', source_agent: 'A25-ZEUS', target_portal: 'swarm', assigned_to: 'claude-code', sprint: 2, tags: ['swarm','langgraph','v67'] },
  { title: 'Build Akashic Records — document vault with pgvector', description: 'Encrypted doc storage + semantic search. mammoth.js installed. Needs pgvector extension in Supabase.', type: 'feature', priority: 40, effort: 'large', source_agent: 'A09-CIPHER', target_portal: 'akashic', assigned_to: 'claude-code', sprint: 2, tags: ['akashic','vector','documents','v67'] },
]

async function main() {
  console.log('🌱 Seeding agent_tasks...')

  const { data, error } = await supabase
    .from('agent_tasks')
    .upsert(TASKS, { onConflict: 'title', ignoreDuplicates: true })
    .select('id, title, priority')

  if (error) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`✅ Seeded ${data?.length ?? 0} tasks`)
  data?.sort((a, b) => b.priority - a.priority)
       .forEach(t => console.log(`  [${t.priority}] ${t.title}`))
}

main()
