import Link from 'next/link'

const TIERS = [
  { code: 'T1', name: 'Free',         price: '$0',       color: '#718096', features: ['10 properties', '5 leads', 'Basic scoring', 'No God Mode'] },
  { code: 'T2', name: 'Starter',      price: '$49/mo',   color: '#63b3ed', features: ['100 properties', 'God Mode 5/day', 'AIN basic', 'LOI generator'] },
  { code: 'T3', name: 'Pro',          price: '$149/mo',  color: '#68d391', features: ['Unlimited properties', 'God Mode 25/day', 'AIN full', 'Skip trace', 'Top 250'] },
  { code: 'T4', name: 'Elite',        price: '$299/mo',  color: '#f6ad55', features: ['Everything in Pro', 'LOI batch', 'Rehab AI', 'Top 250 export', 'Priority support'], popular: true },
  { code: 'T5', name: 'Sovereign',    price: '$499/mo',  color: '#b794f4', features: ['Everything in Elite', 'White-label option', 'Franchise ready', 'Custom agents'] },
  { code: 'T6', name: 'God Mode',     price: '$999/mo',  color: '#fc8181', features: ['Full platform', 'Priority AI', 'Model selection', 'Direct founder access'] },
  { code: 'T7', name: 'Founder',      price: 'Internal', color: '#f6ad55', features: ['Full access', 'All features', 'No billing'], internal: true },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-atlas-dark text-atlas-text">
      <nav className="border-b border-atlas-border px-6 py-4 flex items-center justify-between">
        <Link href="/home" className="text-sm font-mono font-bold text-atlas-gold">← ATLAS</Link>
        <Link href="/login" className="text-xs text-atlas-muted hover:text-atlas-text">Sign In</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-atlas-text">Simple, Transparent Pricing</h1>
          <p className="text-atlas-muted mt-2">WV/Appalachian investor tools. No per-county fees. No hidden costs.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {TIERS.filter(t => !t.internal).map(tier => (
            <div
              key={tier.code}
              className={`rounded-xl border bg-atlas-panel p-5 relative ${tier.popular ? 'border-atlas-gold/50' : 'border-atlas-border'}`}
            >
              {tier.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-atlas-gold text-atlas-dark">
                  MOST POPULAR
                </div>
              )}
              <div className="text-[10px] font-mono text-atlas-muted mb-2">{tier.code}</div>
              <div className="text-base font-bold text-atlas-text mb-1">{tier.name}</div>
              <div className="text-xl font-mono font-bold mb-4" style={{ color: tier.color }}>{tier.price}</div>
              <ul className="space-y-1.5">
                {tier.features.map(f => (
                  <li key={f} className="text-[10px] text-atlas-muted flex items-center gap-1.5">
                    <span style={{ color: tier.color }}>·</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/invite"
            className="inline-block px-8 py-3 rounded-xl bg-atlas-accent/20 text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/30 transition-all text-sm font-medium"
          >
            Request Beta Access →
          </Link>
          <p className="text-xs text-atlas-muted mt-3">Private beta — invite only. All beta users start at Pro tier.</p>
        </div>
      </div>
    </div>
  )
}
