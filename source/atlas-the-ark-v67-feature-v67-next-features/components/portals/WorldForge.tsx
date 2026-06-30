'use client'

import { useState } from 'react'
import { Globe, Wand2, Loader2, Copy, Check, Film, Map, User, Zap, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

type Template = 'three_js' | 'leon_lore' | 'architecture' | 'character' | 'faction'

interface GeneratedContent {
  type: Template
  content: string
  prompt: string
  timestamp: string
}

const TEMPLATES: { id: Template; label: string; icon: React.ReactNode; desc: string; example: string }[] = [
  {
    id: 'three_js',
    label: 'World Scene',
    icon: <Globe size={14} />,
    desc: 'Generate a Three.js 3D scene',
    example: 'A dark Appalachian mining town at dusk with neon ATLAS terminals'
  },
  {
    id: 'leon_lore',
    label: 'Leon Lore',
    icon: <BookOpen size={14} />,
    desc: 'WorldForge universe lore & world-building',
    example: 'The Kanawha Rift — where the Source Code bleeds into physical reality'
  },
  {
    id: 'architecture',
    label: 'Architecture',
    icon: <Map size={14} />,
    desc: 'Spatial & architectural design concepts',
    example: 'The ATLAS Command Cathedral in Saint Albans, WV'
  },
  {
    id: 'character',
    label: 'Character',
    icon: <User size={14} />,
    desc: 'Character profile & backstory',
    example: 'Isaac Brandon Burdette — The Architect of the Source Code'
  },
  {
    id: 'faction',
    label: 'Faction',
    icon: <Zap size={14} />,
    desc: 'Faction / organization profile',
    example: 'The God Squad — 25 AI agents who enforce the Source Code'
  },
]

const TEMPLATE_PROMPTS: Record<Template, string> = {
  three_js: `Generate complete Three.js JavaScript code for a cinematic 3D scene. Include geometry, materials, lighting, camera, animation loop. Use dark Appalachian-futuristic aesthetics. Return ONLY working JavaScript code.`,
  leon_lore: `You are writing lore for the Leon Therano Universe (Atlas Genesis Matrix franchise). The ATLAS platform IS the Source Code of reality — a contractor app that coded existence itself. Generate rich world-building content. Return a JSON object: { title, type, description, lore_entry (3+ paragraphs), connections_to_atlas, known_factions, significance_level (1-10) }`,
  architecture: `Generate detailed architectural concepts for the ATLAS WorldForge universe. Mix Appalachian coal country aesthetics with neural-network futurism and brutalist sacred architecture. Return a JSON object: { name, location, type, description, materials, atmosphere, function, cultural_significance, atlas_connection }`,
  character: `Generate a detailed character profile for the Leon Therano Universe. Characters exist at the intersection of the physical world and the ATLAS Source Code. Return a JSON object: { name, title, role, backstory (2 paragraphs), abilities, atlas_clearance_level, known_associates, quote, faction }`,
  faction: `Generate a detailed faction profile for the Leon Therano Universe. All factions either serve, oppose, or are unaware of the ATLAS Source Code. Return a JSON object: { name, motto, type, headquarters, founding_story, ideology, membership, resources, relationship_to_atlas, known_operations }`,
}

export function WorldForgePortal() {
  const [template, setTemplate] = useState<Template>('leon_lore')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<GeneratedContent[]>([])
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!prompt.trim()) { toast.error('Enter a prompt'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/world/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, template }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')

      const content = data.output ?? data.data?.output ?? JSON.stringify(data.data ?? data, null, 2)
      setResults(prev => [{
        type: template,
        content,
        prompt,
        timestamp: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 10))
      setPrompt('')
      toast.success('WorldForge generated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  const activeTemplate = TEMPLATES.find(t => t.id === template)!

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="atlas-panel rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-sm font-bold text-atlas-accent flex items-center gap-2">
              <Film size={14} /> WorldForge
            </h1>
            <p className="text-[11px] text-atlas-muted mt-0.5">
              Leon Therano Universe · 13-Book Saga · ATLAS Source Code Lore
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0a1520] border border-[#1a3a5f] rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52b788] animate-pulse" />
            <span className="text-[#52b788] text-[10px] font-medium">ACTIVE</span>
          </div>
        </div>

        {/* Template selector */}
        <div className="flex gap-2 flex-wrap mb-4">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                template === t.id
                  ? 'bg-[#1e3a5f] border-[#63b3ed] text-[#63b3ed]'
                  : 'border-[#1e3a5f] text-[#4a6fa5] hover:border-[#2d5a8f] hover:text-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-[#8aa4c8] text-[10px] font-medium mb-1 uppercase tracking-wider">
              {activeTemplate.desc}
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={`e.g. "${activeTemplate.example}"`}
              rows={3}
              className="w-full bg-[#080e1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white placeholder-[#2d4a6e] focus:outline-none focus:border-[#63b3ed] text-xs resize-none"
              onKeyDown={e => e.key === 'Enter' && e.metaKey && generate()}
            />
            <p className="text-[#2d4a6e] text-[10px] mt-1">Cmd+Enter to generate</p>
          </div>

          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 bg-[#1a3a5f] hover:bg-[#1e4a7a] disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            {loading ? 'Generating...' : 'Forge →'}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="atlas-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#4a6fa5] text-[10px]">{TEMPLATES.find(t => t.id === r.type)?.label}</span>
                  <span className="text-[#2d4a6e] text-[10px]">·</span>
                  <span className="text-[#2d4a6e] text-[10px]">{r.timestamp}</span>
                </div>
                <button
                  onClick={() => copy(r.content)}
                  className="text-[#4a6fa5] hover:text-white p-1 transition-colors"
                  title="Copy"
                >
                  {copied ? <Check size={12} className="text-[#52b788]" /> : <Copy size={12} />}
                </button>
              </div>
              <p className="text-[#63b3ed] text-[10px] mb-2 font-medium italic">&quot;{r.prompt}&quot;</p>
              <pre className="text-xs text-atlas-text whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                {r.content}
              </pre>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="atlas-panel rounded-xl p-8 text-center">
          <Film size={32} className="text-[#2d4a6e] mx-auto mb-3" />
          <p className="text-[#4a6fa5] text-sm font-medium mb-1">WorldForge awaits</p>
          <p className="text-[#2d4a6e] text-xs">
            Generate lore, 3D scenes, characters & factions for the Leon Therano Universe
          </p>
        </div>
      )}
    </div>
  )
}
