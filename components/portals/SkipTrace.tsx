'use client'
import { useState } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'

export function SkipTracePortal() {
  const { subscription, setActivePortal } = useArkStore()

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="atlas-panel rounded-xl p-6">
        <h1 className="text-sm font-bold text-atlas-accent flex items-center gap-2 mb-2">
          <Zap size={14} /> SkipTrace Portal
        </h1>
        <p className="text-xs text-atlas-muted mb-4">
          This portal is fully architected in the schema and agent registry. 
          Production build pending Vercel deployment. All API routes are live.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-atlas-surface rounded-lg border border-atlas-border p-3 text-center">
            <div className="text-lg font-bold text-atlas-accent">✓</div>
            <div className="text-[10px] text-atlas-muted">DB Schema</div>
          </div>
          <div className="bg-atlas-surface rounded-lg border border-atlas-border p-3 text-center">
            <div className="text-lg font-bold text-atlas-accent">✓</div>
            <div className="text-[10px] text-atlas-muted">API Routes</div>
          </div>
          <div className="bg-atlas-surface rounded-lg border border-atlas-border p-3 text-center">
            <div className="text-lg font-bold text-atlas-gold">⚠</div>
            <div className="text-[10px] text-atlas-muted">Deploy Pending</div>
          </div>
        </div>
      </div>
    </div>
  )
}
