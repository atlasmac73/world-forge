import { ManifestoPanel } from '@/components/brand/ManifestoPanel'
import Link from 'next/link'

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-atlas-dark text-atlas-text">
      <nav className="border-b border-atlas-border px-6 py-4 flex items-center justify-between">
        <Link href="/home" className="text-sm font-mono font-bold text-atlas-gold hover:opacity-80 transition-opacity">
          ← ATLAS
        </Link>
        <Link href="/login" className="text-xs text-atlas-muted hover:text-atlas-text transition-colors">Sign In</Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <ManifestoPanel section="full" />
      </div>
      <footer className="border-t border-atlas-border px-6 py-8 text-center">
        <p className="text-[10px] font-mono text-white/20">
          ATLAS GENESIS MATRIX LLC · ISAAC BRANDON BURDETTE · SOLE FOUNDER & INVENTOR · PATENT PENDING P001-P100
        </p>
      </footer>
    </div>
  )
}
