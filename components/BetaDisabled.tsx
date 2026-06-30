'use client'

import { Lock } from 'lucide-react'

interface BetaDisabledProps {
  portalName: string
  reason?: string
}

export function BetaDisabled({ portalName, reason }: BetaDisabledProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-[#0d1829] border border-[#1e3a5f] flex items-center justify-center mb-5">
        <Lock size={24} className="text-[#2d5a8f]" />
      </div>
      <h2 className="text-white font-bold text-xl mb-2">{portalName}</h2>
      <div className="inline-flex items-center gap-1.5 bg-[#0a1520] border border-[#1a3a5f] rounded-full px-3 py-1 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f6c90e] animate-pulse" />
        <span className="text-[#f6c90e] text-xs font-medium">Beta Disabled</span>
      </div>
      <p className="text-[#4a6fa5] text-sm max-w-sm">
        {reason ?? 'This portal is currently disabled for the private beta. It will be enabled in a future update.'}
      </p>
    </div>
  )
}
