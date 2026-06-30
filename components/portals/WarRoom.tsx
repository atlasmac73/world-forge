'use client'
import { useState, useEffect } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Radio, AlertTriangle, TrendingUp, DollarSign, Activity, Zap } from 'lucide-react'
import { clsx } from 'clsx'

const LIVE_SIGNALS = [
  { id:'1', type:'lead',  title:'🔥 Hot Lead Detected',        subtitle:'412 Elm St — 94 distress score',          time:'2m ago', priority:'high' },
  { id:'2', type:'sms',   title:'📱 SMS Reply Received',       subtitle:'Owner: "Yes, I\'m interested"',            time:'5m ago', priority:'high' },
  { id:'3', type:'agent', title:'🤖 A12-SPECTER Complete',     subtitle:'3 new properties analyzed',               time:'8m ago', priority:'medium' },
  { id:'4', type:'alert', title:'⚠️ Stripe Not Configured',   subtitle:'All 7 tier price IDs are null',           time:'now',    priority:'critical' },
  { id:'5', type:'alert', title:'🚨 Vercel: 0 deployments',   subtitle:'Push to GitHub immediately',              time:'now',    priority:'critical' },
  { id:'6', type:'lead',  title:'📊 Tax Delinquent List',      subtitle:'47 properties in ZIP 25301',             time:'1h ago', priority:'medium' },
]

const METRICS = [
  { label:'Active Leads',   value:'142', delta:'+12 today',  color:'text-atlas-accent' },
  { label:'Deals Pipeline', value:'$2.4M', delta:'6 props',   color:'text-atlas-gold' },
  { label:'Response Rate',  value:'34%',  delta:'+8% week',  color:'text-atlas-green' },
  { label:'Credits Left',   value:'75',   delta:'today',     color:'text-atlas-purple' },
]

export function WarRoomPortal() {
  const { subscription } = useArkStore()
  const [isLive, setIsLive] = useState(true)

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-atlas-coral flex items-center gap-2">
          <Radio size={14} className="animate-pulse" /> Investor War Room — Live Operations
        </h1>
        <button
          onClick={() => setIsLive(!isLive)}
          className={clsx('text-[10px] px-2 py-1 rounded border transition-all flex items-center gap-1',
            isLive ? 'border-atlas-green/40 text-atlas-green bg-atlas-green/10' : 'border-atlas-border text-atlas-muted'
          )}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full', isLive ? 'bg-atlas-green animate-pulse' : 'bg-atlas-muted')} />
          {isLive ? 'LIVE' : 'PAUSED'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {METRICS.map((m,i) => (
          <div key={i} className="atlas-panel rounded-lg p-3 text-center">
            <div className={clsx('text-xl font-bold', m.color)}>{m.value}</div>
            <div className="text-[9px] text-atlas-muted">{m.label}</div>
            <div className="text-[9px] text-atlas-green mt-0.5">{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="atlas-panel rounded-xl p-4">
          <h2 className="text-xs font-bold text-atlas-text mb-3 flex items-center gap-2">
            <Activity size={12} className="text-atlas-accent" /> Live Signal Stack
          </h2>
          <div className="space-y-2">
            {LIVE_SIGNALS.map((s) => (
              <div key={s.id} className={clsx(
                'rounded-lg border px-3 py-2 flex items-center justify-between',
                s.priority === 'critical' ? 'border-atlas-coral/40 bg-atlas-coral/5' :
                s.priority === 'high' ? 'border-atlas-gold/30 bg-atlas-gold/5' :
                'border-atlas-border bg-atlas-surface'
              )}>
                <div>
                  <div className="text-xs font-semibold text-atlas-text">{s.title}</div>
                  <div className="text-[10px] text-atlas-muted">{s.subtitle}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-atlas-muted">{s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="atlas-panel rounded-xl p-4">
          <h2 className="text-xs font-bold text-atlas-text mb-3">Top 10 Distress Properties</h2>
          {[94,89,85,82,78,74,71,68,65,62].map((score, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-atlas-border/50 last:border-0">
              <span className="text-[10px] text-atlas-muted w-4">{i+1}</span>
              <div className="flex-1">
                <div className="text-[10px] text-atlas-text">{['412 Elm St','234 Oak Ave','89 Pine Rd','1847 Bridge Rd','567 Maple Dr','123 Cedar Ln','890 Walnut St','345 Birch Ave','678 Ash Dr','901 Elm Ct'][i]} · Charleston WV</div>
              </div>
              <div className={clsx('text-xs font-bold', score >= 80 ? 'text-atlas-coral' : score >= 65 ? 'text-atlas-gold' : 'text-atlas-muted')}>
                {score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
