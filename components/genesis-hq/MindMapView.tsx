'use client'

import type { GenesisHqMindMapNode } from '@/lib/genesis-hq/types'

export function MindMapView({ nodes }: { nodes: GenesisHqMindMapNode[] }) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-16 text-slate-600">
        <div className="font-mono text-sm">No mind map data yet</div>
        <div className="text-[11px] mt-1">Seed Genesis HQ from the Admin tab to load the mind map</div>
      </div>
    )
  }

  const byKey = new Map(nodes.map((n) => [n.source_key, n]))

  return (
    <div className="atlas-panel rounded-lg border border-white/10 p-2 overflow-auto">
      <svg viewBox="0 0 1000 720" className="w-full" style={{ minHeight: 500 }}>
        {nodes
          .filter((n) => n.parent_source_key)
          .map((n) => {
            const parent = byKey.get(n.parent_source_key!)
            if (!parent) return null
            return (
              <line
                key={`edge-${n.id}`}
                x1={parent.x} y1={parent.y} x2={n.x} y2={n.y}
                stroke="#ffffff20" strokeWidth={1.5}
              />
            )
          })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.radius} fill={n.color} />
            {n.label.split('\n').map((line, i, arr) => (
              <text
                key={i}
                x={n.x}
                y={n.y + (i - (arr.length - 1) / 2) * 11 + 3}
                textAnchor="middle"
                fontSize={9}
                fontFamily="monospace"
                fontWeight="bold"
                fill={n.text_color ?? '#fff'}
              >
                {line}
              </text>
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}
