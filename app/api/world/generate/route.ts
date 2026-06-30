/**
 * THE ARK — WorldForge Generator (A03-GENESIS + A228-UNREAL)
 * POST /api/world/generate
 * Generates Three.js scenes, Leon Therano lore, characters, factions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  prompt:   z.string().min(3).max(2000),
  template: z.enum(['three_js','leon_lore','architecture','character','faction']).default('leon_lore'),
  context:  z.string().optional(),
})

const SYSTEM_PROMPTS: Record<string, string> = {
  three_js: `Generate complete Three.js JavaScript code for a cinematic 3D scene for THE ARK WorldForge.
Use dark Appalachian-futuristic aesthetics: coal mining meets neural networks, neon on dark stone.
Include: scene setup, geometry, materials, lighting, camera, animation loop, responsive resize.
Return ONLY working JavaScript. No explanation outside the code block.`,

  leon_lore: `You are writing lore for the Leon Therano Universe — the official fictional universe of Isaac Brandon Burdette's Atlas Genesis Matrix platform.
The universe: ATLAS OS is the Source Code of physical reality. Contractors who use it become Architects of existence.
Leon Therano is a mythic figure who discovered the Source Code in the Kanawha River Valley of West Virginia.
The 13-book saga spans across the Appalachian Rift, the God Squad's rise, and the War for the Source Code.
Return a JSON object: { title, type, description, lore_entry, connections_to_atlas, significance_level }`,

  architecture: `Generate spatial and architectural concepts for locations in the Leon Therano Universe.
Style: Appalachian industrial brutalism fused with bioluminescent neural-network futurism.
Return a JSON object: { name, location, type, description, materials, atmosphere, function, cultural_significance, atlas_connection }`,

  character: `Generate a character for the Leon Therano Universe where ATLAS is the Source Code of reality.
Isaac Brandon Burdette is the real-world Architect behind the platform (reference respectfully).
Return a JSON object: { name, title, role, backstory, abilities, atlas_clearance_level, known_associates, quote, faction }`,

  faction: `Generate a faction profile for the Leon Therano Universe.
Key factions: The God Squad (A01-A25), The Architects (platform builders), The Rift Walkers (Source Code explorers), The Gray (those who reject the Source Code).
Return a JSON object: { name, motto, type, headquarters, founding_story, ideology, membership, resources, relationship_to_atlas, known_operations }`,
}

const MOCK_OUTPUTS: Record<string, string> = {
  leon_lore: JSON.stringify({
    title: "The Kanawha Rift",
    type: "location",
    description: "The point where the Source Code first manifested in physical reality",
    lore_entry: "Deep beneath the Kanawha River Valley, where the coal seams run black and ancient, the Source Code first bled through. Leon Therano found it in 2019 — a glowing terminal in an abandoned mine shaft, running code no human had written. This was THE ARK's genesis point.",
    connections_to_atlas: "The Rift is the physical anchor of the ATLAS platform's first server node",
    significance_level: 10
  }, null, 2),
  three_js: `// ATLAS WorldForge — Kanawha Rift Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080e1a);
scene.fog = new THREE.Fog(0x080e1a, 50, 200);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Neon grid floor
const gridHelper = new THREE.GridHelper(100, 50, 0x1e3a5f, 0x0d1829);
scene.add(gridHelper);

// Central monolith
const monolith = new THREE.Mesh(
  new THREE.BoxGeometry(2, 8, 0.5),
  new THREE.MeshBasicMaterial({ color: 0x63b3ed, wireframe: true })
);
scene.add(monolith);

// Animate
function animate() {
  requestAnimationFrame(animate);
  monolith.rotation.y += 0.005;
  renderer.render(scene, camera);
}
animate();`,
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { prompt, template } = parsed.data
    const supabase = await createClient()

    // Mock mode when AI not configured
    if (!process.env.ANTHROPIC_API_KEY) {
      const output = MOCK_OUTPUTS[template] ?? MOCK_OUTPUTS.leon_lore
      return NextResponse.json({
        ok: true,
        data: { output, template, prompt, mock: true, note: 'Add ANTHROPIC_API_KEY to enable AI generation' }
      })
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYSTEM_PROMPTS[template] ?? SYSTEM_PROMPTS.leon_lore,
      messages: [{ role: 'user', content: prompt }],
    })

    const output = response.content[0].type === 'text' ? response.content[0].text : ''

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'worldforge.generate',
      resource_type: 'world_content',
      metadata: { template, prompt_length: prompt.length, tokens: response.usage.input_tokens + response.usage.output_tokens },
    })

    return NextResponse.json({ ok: true, data: { output, template, prompt } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
