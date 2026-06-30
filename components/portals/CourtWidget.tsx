'use client'

/**
 * ATLAS v67 — Court Widget
 * County court record extraction prototype.
 * Adapted from V20 AUTOPOIETIC — admin/prototype only.
 *
 * ⚠️ IMPORTANT DISCLAIMERS:
 * - This is a research prototype — not production court data
 * - All extractions are AI-generated estimates, NOT verified public records
 * - Do not present results as official county records
 * - Results are stored as artifacts for review, not as authoritative data
 *
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState } from 'react'
import { Search, AlertTriangle, FileText, ExternalLink, Loader2, Database } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface CourtRecord {
  case_number?: string
  case_type: string
  filing_date?: string
  parties: string[]
  status: string
  description: string
  court: string
  confidence: 'high' | 'medium' | 'low'
}

interface ExtractionResult {
  address: string
  county: string
  records: CourtRecord[]
  extraction_notes: string
  disclaimer: string
  artifact_id?: string
}

export function CourtWidget() {
  const [address, setAddress] = useState('')
  const [county, setCounty] = useState('Kanawha')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)

  async function runExtraction() {
    if (!address.trim()) {
      toast.error('Enter a property address')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/court-widget/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), county }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult(data.data)
        toast.success(`Court extraction complete — ${data.data.records.length} potential records found`)
      } else {
        toast.error(data.error ?? 'Extraction failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const WV_COUNTIES = [
    'Barbour','Berkeley','Boone','Braxton','Brooke','Cabell','Calhoun','Clay',
    'Doddridge','Fayette','Gilmer','Grant','Greenbrier','Hampshire','Hancock',
    'Hardy','Harrison','Jackson','Jefferson','Kanawha','Lewis','Lincoln','Logan',
    'McDowell','Marion','Marshall','Mason','Mercer','Mineral','Mingo','Monongalia',
    'Monroe','Morgan','Nicholas','Ohio','Pendleton','Pleasants','Pocahontas',
    'Preston','Putnam','Raleigh','Randolph','Ritchie','Roane','Summers','Taylor',
    'Tucker','Tyler','Upshur','Wayne','Webster','Wetzel','Wirt','Wood','Wyoming'
  ]

  return (
    <div className="space-y-4">
      {/* Disclaimer Banner */}
      <div className="rounded-xl border border-atlas-gold/30 bg-atlas-gold/8 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-atlas-gold shrink-0 mt-0.5" />
          <div className="text-xs text-atlas-muted">
            <strong className="text-atlas-gold">Research Prototype</strong> — Court extractions are AI-generated estimates for research purposes only.
            Not verified public court records. Always verify with official county clerk sources before any legal or investment decision.
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runExtraction()}
            placeholder="Property address..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-accent/50"
          />
          <select
            value={county}
            onChange={e => setCounty(e.target.value)}
            className="px-2 py-2 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text focus:outline-none w-36"
          >
            {WV_COUNTIES.map(c => <option key={c} value={c}>{c} Co.</option>)}
          </select>
          <button
            onClick={runExtraction}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-atlas-accent/15 text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/25 text-xs transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Extract
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-atlas-text">{result.address}</p>
              <p className="text-[10px] text-atlas-muted">{result.county} County WV · {result.records.length} potential records</p>
            </div>
            {result.artifact_id && (
              <span className="text-[9px] text-atlas-muted flex items-center gap-1">
                <Database size={9} /> Saved as artifact
              </span>
            )}
          </div>

          {result.records.length === 0 ? (
            <div className="rounded-xl border border-atlas-border bg-atlas-panel p-6 text-center">
              <p className="text-sm text-atlas-muted">No court records found for this address.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {result.records.map((record, i) => (
                <div key={i} className="rounded-xl border border-atlas-border bg-atlas-panel p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-atlas-accent shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-atlas-text">{record.case_type}</span>
                      {record.case_number && (
                        <span className="text-[9px] font-mono text-atlas-muted">{record.case_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={clsx(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded border',
                        record.confidence === 'high'   ? 'text-atlas-green border-atlas-green/30 bg-atlas-green/10' :
                        record.confidence === 'medium' ? 'text-atlas-gold border-atlas-gold/30 bg-atlas-gold/10' :
                                                         'text-atlas-muted border-white/10 bg-white/5'
                      )}>
                        {record.confidence.toUpperCase()}
                      </span>
                      <span className={clsx(
                        'text-[9px] px-1.5 py-0.5 rounded border',
                        record.status === 'Active'  ? 'text-atlas-coral border-atlas-coral/30 bg-atlas-coral/10' :
                        record.status === 'Closed'  ? 'text-atlas-muted border-white/10 bg-white/5' :
                                                       'text-atlas-gold border-atlas-gold/30 bg-atlas-gold/10'
                      )}>
                        {record.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-atlas-muted mb-1">{record.description}</p>
                  <div className="flex items-center gap-3 text-[9px] text-white/30">
                    <span>{record.court}</span>
                    {record.filing_date && <span>Filed: {record.filing_date}</span>}
                    {record.parties.length > 0 && <span>Parties: {record.parties.join(', ')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-white/8 bg-white/3 p-3">
            <p className="text-[10px] text-atlas-muted">{result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  )
}
