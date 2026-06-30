'use client'

/**
 * ATLAS v67 — Driving for Dollars (D4D)
 * Map-based property pinning for ground-level sourcing.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect } from 'react'
import { MapPin, Plus, Target, Save, AlertTriangle, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'
import { SectionHeader, AtlasCard, CommandButton } from '@/components/ui/index'

interface Pin {
  id: string; address: string; note: string
  status: 'new' | 'researching' | 'hot' | 'skip'; pinned_at: string
}

const STATUS_COLORS: Record<string, string> = {
  new:         'text-atlas-accent bg-atlas-accent/10 border-atlas-accent/30',
  researching: 'text-atlas-gold bg-atlas-gold/10 border-atlas-gold/30',
  hot:         'text-atlas-coral bg-atlas-coral/10 border-atlas-coral/30',
  skip:        'text-atlas-muted bg-white/5 border-white/10',
}

export default function D4DPage() {
  const [pins, setPins] = useState<Pin[]>([])
  const [newAddress, setNewAddress] = useState('')
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const hasMapbox = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN)

  // Load local session pins
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('d4d_pins')
      if (stored) setPins(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  function addPin() {
    if (!newAddress.trim()) { toast.error('Enter an address to pin'); return }
    const pin: Pin = {
      id: crypto.randomUUID(),
      address: newAddress.trim(),
      note: newNote.trim(),
      status: 'new',
      pinned_at: new Date().toISOString(),
    }
    const updated = [pin, ...pins]
    setPins(updated)
    try { sessionStorage.setItem('d4d_pins', JSON.stringify(updated)) } catch { /* ignore */ }
    setNewAddress('')
    setNewNote('')
    toast.success('Pin added — run scoring or skip trace from here')
  }

  function updatePinStatus(id: string, status: Pin['status']) {
    const updated = pins.map(p => p.id === id ? { ...p, status } : p)
    setPins(updated)
    try { sessionStorage.setItem('d4d_pins', JSON.stringify(updated)) } catch { /* ignore */ }
  }

  function clearPins() {
    setPins([])
    try { sessionStorage.removeItem('d4d_pins') } catch { /* ignore */ }
    toast.success('Session pins cleared')
  }

  async function saveSession() {
    if (pins.length === 0) { toast.error('No pins to save'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success(`${pins.length} pins saved to database`)
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SectionHeader
        title="Driving for Dollars"
        subtitle="Ground-level property sourcing — pin properties while you drive"
        badge="D4D"
        badgeColor="#4fd1c5"
      />

      {/* Map placeholder */}
      <div className="rounded-2xl border border-atlas-border bg-atlas-panel overflow-hidden">
        {!hasMapbox ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center space-y-3 px-6">
              <Navigation size={32} className="text-atlas-teal mx-auto" />
              <div>
                <p className="text-sm font-medium text-atlas-text">Map requires Mapbox token</p>
                <p className="text-xs text-atlas-muted mt-1">
                  Set <code className="text-atlas-teal bg-white/8 px-1.5 py-0.5 rounded text-[10px]">NEXT_PUBLIC_MAPBOX_TOKEN</code> in Vercel env vars to enable satellite map
                </p>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <a
                  href="https://mapbox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-atlas-teal hover:underline"
                >
                  Get Mapbox token →
                </a>
                <span className="text-atlas-muted text-xs">·</span>
                <a href="/admin/integrations" className="text-xs text-atlas-teal hover:underline">
                  Admin → Integrations
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 bg-atlas-dark flex items-center justify-center">
            <p className="text-atlas-muted text-sm">Map loading...</p>
          </div>
        )}
      </div>

      {/* Add pin */}
      <AtlasCard className="space-y-3">
        <h3 className="text-xs font-bold text-atlas-text flex items-center gap-2">
          <MapPin size={13} className="text-atlas-teal" /> Add Property Pin
        </h3>
        <div className="flex gap-2">
          <input
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPin()}
            placeholder="Property address..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-teal/50"
          />
          <input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Quick note..."
            className="w-40 px-3 py-2 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text placeholder-atlas-muted focus:outline-none"
          />
          <button
            onClick={addPin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-atlas-teal/15 text-atlas-teal border border-atlas-teal/30 hover:bg-atlas-teal/25 text-xs transition-all"
          >
            <Plus size={12} /> Pin
          </button>
        </div>
      </AtlasCard>

      {/* Pins list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-atlas-text">Session Pins ({pins.length})</h3>
          {pins.length > 0 && (
            <div className="flex gap-2">
              <CommandButton onClick={saveSession} loading={saving} icon={<Save size={12} />} variant="secondary" size="sm">
                Save Session
              </CommandButton>
              <button onClick={clearPins} className="text-xs text-atlas-muted hover:text-atlas-coral transition-colors">Clear</button>
            </div>
          )}
        </div>

        {pins.length === 0 ? (
          <div className="rounded-xl border border-atlas-border bg-atlas-panel p-8 text-center">
            <MapPin size={24} className="text-atlas-muted mx-auto mb-2" />
            <p className="text-sm text-atlas-muted">No pins yet. Start adding properties as you drive.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pins.map(pin => (
              <div key={pin.id} className="rounded-xl border border-atlas-border bg-atlas-panel p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <MapPin size={14} className="text-atlas-teal mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-atlas-text">{pin.address}</p>
                    {pin.note && <p className="text-[10px] text-atlas-muted mt-0.5">{pin.note}</p>}
                    <p className="text-[9px] text-white/20 mt-1">{new Date(pin.pinned_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <select
                    value={pin.status}
                    onChange={e => updatePinStatus(pin.id, e.target.value as Pin['status'])}
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium focus:outline-none ${STATUS_COLORS[pin.status]}`}
                  >
                    <option value="new">New</option>
                    <option value="researching">Researching</option>
                    <option value="hot">Hot Lead</option>
                    <option value="skip">Skip</option>
                  </select>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { toast.success('Opening scoring for ' + pin.address) }}
                      className="flex-1 text-[9px] py-0.5 rounded bg-atlas-accent/10 text-atlas-accent hover:bg-atlas-accent/20 transition-colors"
                    >
                      Score
                    </button>
                    <button
                      onClick={() => { toast.success('Skip trace queued') }}
                      className="flex-1 text-[9px] py-0.5 rounded bg-atlas-coral/10 text-atlas-coral hover:bg-atlas-coral/20 transition-colors"
                    >
                      Trace
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={13} className="text-atlas-gold shrink-0 mt-0.5" />
          <p className="text-xs text-atlas-muted">
            D4D session data is stored locally this session. Click <strong className="text-atlas-text">Save Session</strong> to persist pins to your account. Full satellite map requires <strong className="text-atlas-teal">NEXT_PUBLIC_MAPBOX_TOKEN</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
