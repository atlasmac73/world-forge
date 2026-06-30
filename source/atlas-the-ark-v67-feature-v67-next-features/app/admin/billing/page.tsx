'use client'

/**
 * ATLAS v67 — Admin Billing Dashboard
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Users, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { SectionHeader, MetricCard, StatusBadge } from '@/components/ui/index'

interface TierData {
  code: string; name: string; price_monthly: number
  credits_daily: number; is_available: boolean
  stripe_price_id: string | null
}

interface BillingData {
  tiers: TierData[]
  billing_enabled: boolean
  current_tier: string
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/tiers')
      const json = await res.json()
      if (json.ok) setData(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <SectionHeader
          title="Billing & Subscriptions"
          subtitle="Stripe configuration and tier status"
          badge="ADMIN"
          badgeColor="#f6ad55"
        />
        <button onClick={fetchData} className="p-2 rounded-lg hover:bg-white/5 text-atlas-muted">
          <RefreshCw size={14} className={clsx(loading && 'animate-spin')} />
        </button>
      </div>

      {/* Stripe Status */}
      <div className={clsx(
        'rounded-xl border p-4 flex items-center gap-4',
        data?.billing_enabled
          ? 'border-atlas-green/30 bg-atlas-green/8'
          : 'border-atlas-gold/30 bg-atlas-gold/8'
      )}>
        <CreditCard size={20} className={data?.billing_enabled ? 'text-atlas-green' : 'text-atlas-gold'} />
        <div className="flex-1">
          <div className="font-semibold text-sm text-atlas-text">
            {data?.billing_enabled ? '✅ Stripe Connected' : '⚠️ Stripe Not Configured'}
          </div>
          <div className="text-xs text-atlas-muted mt-0.5">
            {data?.billing_enabled
              ? 'STRIPE_SECRET_KEY set — billing active'
              : 'Set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Vercel env vars'}
          </div>
        </div>
        {!data?.billing_enabled && (
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-atlas-gold hover:underline"
          >
            Stripe Dashboard <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Tier Grid */}
      <div className="rounded-xl border border-atlas-border bg-atlas-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-atlas-border bg-white/3">
          <h3 className="text-xs font-bold text-atlas-text uppercase tracking-wider">Subscription Tiers</h3>
        </div>
        <div className="divide-y divide-white/5">
          {(data?.tiers ?? []).map(tier => (
            <div key={tier.code} className="flex items-center gap-4 px-4 py-3">
              <div className="w-16">
                <span className="text-xs font-mono font-bold text-atlas-muted">{tier.code}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-atlas-text">{tier.name}</span>
                  {tier.code === data?.current_tier && (
                    <StatusBadge status="active" label="YOUR PLAN" />
                  )}
                </div>
                <div className="text-xs text-atlas-muted mt-0.5">
                  ${tier.price_monthly}/mo · {tier.credits_daily.toLocaleString()} credits/day
                </div>
              </div>
              <div className="text-right">
                {tier.stripe_price_id ? (
                  <div>
                    <StatusBadge status="live" label="CONFIGURED" />
                    <div className="text-[9px] font-mono text-atlas-muted mt-1 truncate max-w-32">
                      {tier.stripe_price_id.slice(0, 20)}…
                    </div>
                  </div>
                ) : tier.price_monthly === 0 ? (
                  <StatusBadge status="active" label="FREE" />
                ) : (
                  <div>
                    <StatusBadge status="pending" label="MISSING PRICE ID" />
                    <div className="text-[9px] text-atlas-muted mt-1">
                      Set STRIPE_PRICE_{tier.code}_* in Vercel
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 space-y-3">
        <h3 className="text-xs font-bold text-atlas-text">Stripe Setup Checklist</h3>
        <div className="space-y-2 text-xs text-atlas-muted">
          {[
            { label: 'Create Stripe account + API keys', done: Boolean(data?.billing_enabled) },
            { label: 'Create products for T2-T6 in Stripe Dashboard', done: false },
            { label: 'Set STRIPE_PRICE_T2_STARTER in Vercel env vars', done: Boolean(data?.tiers?.find(t => t.code === 'T2')?.stripe_price_id) },
            { label: 'Set STRIPE_PRICE_T3_PRO in Vercel env vars', done: Boolean(data?.tiers?.find(t => t.code === 'T3')?.stripe_price_id) },
            { label: 'Set STRIPE_PRICE_T4_POWER + T5 + T6 in Vercel', done: false },
            { label: 'Register webhook at /api/billing/webhook in Stripe Dashboard', done: false },
            { label: 'Set STRIPE_WEBHOOK_SECRET in Vercel env vars', done: Boolean(process.env.STRIPE_WEBHOOK_SECRET) },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={step.done ? 'text-atlas-green' : 'text-atlas-muted'}>
                {step.done ? '✅' : '⬜'}
              </span>
              <span className={step.done ? 'text-atlas-text line-through opacity-60' : 'text-atlas-muted'}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
