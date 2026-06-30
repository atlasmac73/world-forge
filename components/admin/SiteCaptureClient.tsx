'use client'

/**
 * ATLAS v67 — Site Capture console (founder/admin only)
 * Upload photos → parse EXIF + enrich from free public data → fuse measurements
 * from multiple methods (tape, known-object scale, …) with a confidence score.
 * See 07_PLANS/8_SITE_CAPTURE_MEASUREMENT_PLAN.md.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { Camera, Loader2, Plus, MapPin, Ruler, X, Upload, Download, RefreshCw, Lightbulb } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface CaptureRow { id: string; title: string; latitude: number | null; longitude: number | null; status: string; updated_at: string }
interface Asset {
  id: string; filename: string; camera_model: string | null; focal_length_mm: number | null
  latitude: number | null; longitude: number | null; captured_at: string | null
  image_width: number | null; image_height: number | null; media_type: string
}
interface Measurement {
  id: string; label: string; kind: string; value: number | null; unit: string
  sigma: number | null; confidence: number | null; conflict: boolean
  source_provenance: Array<{ source: string; value: number; sigma: number; weight: number; z: number }>
}
interface CaptureDetail { capture: CaptureRow & { enrichment?: Record<string, unknown>; notes?: string }; assets: Asset[]; measurements: Measurement[] }
interface Recommendation { action: string; rationale: string; method: string; expected_gain: 'high' | 'medium' | 'low' }

const KNOWN_OBJECTS = [
  'us_license_plate', 'letter_paper', 'credit_card', 'brick_course', 'cmu_block',
  'standard_door', 'garage_door_single', 'sidewalk_square', 'parking_stall_l',
  'four_ft_level', 'two_ft_level', 'tape_1ft_mark', 'fence_panel_6ft', 'fence_panel_8ft', 'concrete_block_8in',
]

type ObsType = 'manual' | 'known_object' | 'custom_object'
interface ObsRow {
  type: ObsType; value: string; objectKey: string; referencePixels: string; targetPixels: string
  customLabel: string; customSize: string; customUnit: 'in' | 'ft' | 'm'
}
const emptyRow = (): ObsRow => ({
  type: 'manual', value: '', objectKey: 'us_license_plate', referencePixels: '', targetPixels: '',
  customLabel: '24x24 marker board', customSize: '24', customUnit: 'in',
})

export function SiteCaptureClient({ userRole }: { userRole: string }) {
  const [captures, setCaptures] = useState<CaptureRow[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [detail, setDetail] = useState<CaptureDetail | null>(null)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)

  const [recs, setRecs] = useState<Recommendation[]>([])

  const loadCaptures = useCallback(async () => {
    const j = await fetch('/api/site-capture').then(r => r.json())
    if (j.ok) setCaptures(j.captures)
  }, [])
  const loadDetail = useCallback(async (id: string) => {
    const j = await fetch(`/api/site-capture?id=${id}`).then(r => r.json())
    if (j.ok) setDetail(j)
  }, [])
  const loadRecs = useCallback(async (id: string) => {
    const j = await fetch(`/api/site-capture/${id}/recommend`).then(r => r.json())
    if (j.ok) setRecs(j.recommendations)
  }, [])
  useEffect(() => { loadCaptures() }, [loadCaptures])
  useEffect(() => { if (active) { loadDetail(active); loadRecs(active) } }, [active, loadDetail, loadRecs])

  const refresh = () => { if (active) { loadDetail(active); loadRecs(active) } }

  const downloadAsset = async (id: string) => {
    const j = await fetch(`/api/site-capture/asset/${id}`).then(r => r.json())
    if (j.ok) window.open(j.url, '_blank'); else toast.error(j.error || 'No stored file')
  }
  const reanalyzeAsset = async (id: string) => {
    const j = await fetch(`/api/site-capture/asset/${id}`, { method: 'POST' }).then(r => r.json())
    if (j.ok) { toast.success('Re-analyzed'); refresh() } else toast.error(j.error || 'Re-analyze failed')
  }

  const upload = async () => {
    if (!files || files.length === 0) { toast.error('Pick photo(s)'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', title || 'Untitled capture')
      Array.from(files).forEach(f => fd.append('files', f))
      const j = await fetch('/api/site-capture', { method: 'POST', body: fd }).then(r => r.json())
      if (j.ok) {
        toast.success(`Ingested ${j.assets?.length ?? 0} file(s)${j.location ? ' · GPS found' : ''}`)
        setTitle(''); setFiles(null); await loadCaptures(); setActive(j.captureId)
      } else toast.error(j.error || 'Upload failed')
    } finally { setUploading(false) }
  }

  return (
    <div className="min-h-screen bg-atlas-bg text-atlas-text p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-5">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-atlas-accent" />
            <h1 className="text-lg font-bold tracking-wide">Site Capture</h1>
            <span className="text-[10px] uppercase tracking-widest text-atlas-muted ml-2">{userRole} · founder-only</span>
          </div>
          <p className="text-xs text-atlas-muted mt-1">
            Photos → EXIF + free public data → fused measurements with confidence. Original files only (no screenshots).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Captures + upload */}
          <Card>
            <div className="text-[10px] uppercase tracking-wider text-atlas-muted mb-2">New capture</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g. 123 Main pool)"
              className="w-full bg-atlas-surface border border-atlas-border rounded-md px-2 py-1 text-[11px] mb-2 outline-none focus:border-atlas-accent" />
            <label className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-dashed border-atlas-border text-[11px] text-atlas-muted cursor-pointer hover:border-atlas-accent">
              <Upload size={12} /> {files?.length ? `${files.length} file(s)` : 'Choose photos / scans'}
              <input type="file" multiple
                accept="image/*,.heic,.heif,.usdz,.obj,.ply,.glb,.gltf,.zip,.pdf"
                className="hidden" onChange={e => setFiles(e.target.files)} />
            </label>
            <button onClick={upload} disabled={uploading}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-atlas-accent text-black text-[11px] font-bold disabled:opacity-50">
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Ingest
            </button>

            <div className="text-[10px] uppercase tracking-wider text-atlas-muted mt-4 mb-2">Captures</div>
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {captures.map(c => (
                <button key={c.id} onClick={() => setActive(c.id)}
                  className={clsx('w-full text-left px-2.5 py-1.5 rounded-md text-[11px] border',
                    active === c.id ? 'border-atlas-accent bg-atlas-accent/10' : 'border-atlas-border bg-atlas-surface')}>
                  <div className="truncate">{c.title}</div>
                  <div className="text-[9px] text-atlas-muted flex items-center gap-1">
                    {c.latitude != null ? <><MapPin size={8} /> {c.latitude.toFixed(4)}, {c.longitude?.toFixed(4)}</> : 'no GPS'}
                  </div>
                </button>
              ))}
              {captures.length === 0 && <p className="text-[11px] text-atlas-muted">No captures yet.</p>}
            </div>
          </Card>

          {/* Detail */}
          <div className="lg:col-span-2 space-y-4">
            {!detail ? (
              <Card><p className="text-[11px] text-atlas-muted">Select or create a capture.</p></Card>
            ) : (
              <>
                <Card>
                  <div className="text-[10px] uppercase tracking-wider text-atlas-muted mb-2">Assets ({detail.assets.length})</div>
                  <div className="space-y-1 max-h-[28vh] overflow-y-auto">
                    {detail.assets.map(a => (
                      <div key={a.id} className="group text-[10px] bg-atlas-surface border border-atlas-border rounded-md px-2 py-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="truncate font-semibold flex-1">
                            {a.media_type && a.media_type !== 'image' && (
                              <span className="mr-1 text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-atlas-accent/15 text-atlas-accent">
                                {a.media_type === 'lidar_scan' ? 'LiDAR' : a.media_type}
                              </span>
                            )}
                            {a.filename}
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => downloadAsset(a.id)} title="Open original (signed URL)"
                              className="text-atlas-muted hover:text-atlas-accent"><Download size={11} /></button>
                            <button onClick={() => reanalyzeAsset(a.id)} title="Re-analyze from stored file"
                              className="text-atlas-muted hover:text-atlas-accent"><RefreshCw size={11} /></button>
                          </div>
                        </div>
                        <div className="text-atlas-muted">
                          {a.camera_model ?? 'unknown cam'}{a.focal_length_mm ? ` · ${a.focal_length_mm}mm` : ''}
                          {a.image_width ? ` · ${a.image_width}×${a.image_height}` : ''}
                          {a.latitude != null ? ' · 📍GPS' : ''}{a.captured_at ? ` · ${new Date(a.captured_at).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                    ))}
                    {detail.assets.length === 0 && <p className="text-[11px] text-atlas-muted">No assets.</p>}
                  </div>
                  {detail.capture.enrichment && Object.keys(detail.capture.enrichment).length > 0 && (
                    <div className="mt-2 text-[10px] text-atlas-muted border-t border-atlas-border pt-2">
                      <span className="text-atlas-gold font-semibold">Enrichment:</span>{' '}
                      {renderEnrichment(detail.capture.enrichment)}
                    </div>
                  )}
                </Card>

                <MeasurementPanel captureId={detail.capture.id} measurements={detail.measurements}
                  onChange={refresh} />

                <Card>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={13} className="text-atlas-gold" />
                    <span className="text-[10px] uppercase tracking-wider text-atlas-muted">Next best capture</span>
                  </div>
                  <div className="space-y-1.5">
                    {recs.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] bg-atlas-surface border border-atlas-border rounded-md px-2.5 py-1.5">
                        <span className={clsx('mt-0.5 text-[8px] font-bold px-1 py-0.5 rounded uppercase shrink-0',
                          r.expected_gain === 'high' ? 'bg-green-500/15 text-green-400'
                            : r.expected_gain === 'medium' ? 'bg-atlas-gold/15 text-atlas-gold'
                            : 'bg-white/5 text-atlas-muted')}>{r.expected_gain}</span>
                        <div>
                          <div className="text-atlas-text font-semibold">{r.action}</div>
                          <div className="text-atlas-muted">{r.rationale}</div>
                        </div>
                      </div>
                    ))}
                    {recs.length === 0 && <p className="text-[11px] text-atlas-muted">No suggestions.</p>}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MeasurementPanel({ captureId, measurements, onChange }:
  { captureId: string; measurements: Measurement[]; onChange: () => void }) {
  const [label, setLabel] = useState('')
  const [unit, setUnit] = useState<'ft' | 'm'>('ft')
  const [rows, setRows] = useState<ObsRow[]>([emptyRow()])
  const [running, setRunning] = useState(false)
  const [includeFootprint, setIncludeFootprint] = useState(false)
  const [autoRunning, setAutoRunning] = useState(false)

  const autoMeasure = async () => {
    setAutoRunning(true)
    try {
      const j = await fetch(`/api/site-capture/${captureId}/auto-measure`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unit }),
      }).then(r => r.json())
      if (j.ok) { toast.success(`Derived ${j.created?.length ?? 0} from public data`); onChange() }
      else toast.error(j.error || 'No public data to derive from')
    } finally { setAutoRunning(false) }
  }

  const addRow = () => setRows(r => [...r, emptyRow()])
  const setRow = (i: number, patch: Partial<ObsRow>) => setRows(r => r.map((x, j) => j === i ? { ...x, ...patch } : x))
  const delRow = (i: number) => setRows(r => r.filter((_, j) => j !== i))

  const run = async () => {
    if (!label.trim()) { toast.error('Label required'); return }
    const observations = rows.map(r => {
      if (r.type === 'manual') return { type: 'manual' as const, value: parseFloat(r.value), unit }
      if (r.type === 'custom_object') return {
        type: 'custom_object' as const, label: r.customLabel || 'custom object',
        sizeValue: parseFloat(r.customSize), sizeUnit: r.customUnit,
        referencePixels: parseFloat(r.referencePixels), targetPixels: parseFloat(r.targetPixels),
      }
      return { type: 'known_object' as const, objectKey: r.objectKey, referencePixels: parseFloat(r.referencePixels), targetPixels: parseFloat(r.targetPixels) }
    }).filter(o =>
      o.type === 'manual' ? Number.isFinite(o.value)
        : o.type === 'custom_object' ? Number.isFinite(o.sizeValue) && Number.isFinite(o.referencePixels) && Number.isFinite(o.targetPixels)
        : Number.isFinite(o.referencePixels) && Number.isFinite(o.targetPixels)
    )
    if (observations.length === 0 && !includeFootprint) { toast.error('Add an observation or include the footprint edge'); return }
    setRunning(true)
    try {
      const j = await fetch(`/api/site-capture/${captureId}/measure`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, unit, observations, includeFootprintEdge: includeFootprint }),
      }).then(r => r.json())
      if (j.ok) { toast.success('Measured'); setLabel(''); onChange() }
      else toast.error(j.error || 'Measure failed')
    } finally { setRunning(false) }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Ruler size={13} className="text-atlas-accent" />
        <span className="text-[10px] uppercase tracking-wider text-atlas-muted">Fuse a measurement</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. pool length)"
          className="flex-1 bg-atlas-surface border border-atlas-border rounded-md px-2 py-1 text-[11px] outline-none focus:border-atlas-accent" />
        <select value={unit} onChange={e => setUnit(e.target.value as 'ft' | 'm')}
          className="bg-atlas-surface border border-atlas-border rounded-md px-2 py-1 text-[11px]">
          <option value="ft">ft</option><option value="m">m</option>
        </select>
      </div>

      <div className="space-y-1.5 mb-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px]">
            <select value={r.type} onChange={e => setRow(i, { type: e.target.value as ObsType })}
              className="bg-atlas-surface border border-atlas-border rounded px-1 py-1">
              <option value="manual">tape/manual</option>
              <option value="known_object">known object</option>
              <option value="custom_object">custom object</option>
            </select>
            {r.type === 'manual' && (
              <input value={r.value} onChange={e => setRow(i, { value: e.target.value })} placeholder={`value (${unit})`}
                className="flex-1 bg-atlas-surface border border-atlas-border rounded px-1.5 py-1 outline-none" />
            )}
            {r.type === 'known_object' && (
              <>
                <select value={r.objectKey} onChange={e => setRow(i, { objectKey: e.target.value })}
                  className="bg-atlas-surface border border-atlas-border rounded px-1 py-1 max-w-[110px]">
                  {KNOWN_OBJECTS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <input value={r.referencePixels} onChange={e => setRow(i, { referencePixels: e.target.value })} placeholder="ref px"
                  className="w-14 bg-atlas-surface border border-atlas-border rounded px-1.5 py-1 outline-none" />
                <input value={r.targetPixels} onChange={e => setRow(i, { targetPixels: e.target.value })} placeholder="tgt px"
                  className="w-14 bg-atlas-surface border border-atlas-border rounded px-1.5 py-1 outline-none" />
              </>
            )}
            {r.type === 'custom_object' && (
              <>
                <input value={r.customLabel} onChange={e => setRow(i, { customLabel: e.target.value })} placeholder="name"
                  className="w-24 bg-atlas-surface border border-atlas-border rounded px-1.5 py-1 outline-none" />
                <input value={r.customSize} onChange={e => setRow(i, { customSize: e.target.value })} placeholder="size"
                  className="w-12 bg-atlas-surface border border-atlas-border rounded px-1.5 py-1 outline-none" />
                <select value={r.customUnit} onChange={e => setRow(i, { customUnit: e.target.value as 'in' | 'ft' | 'm' })}
                  className="bg-atlas-surface border border-atlas-border rounded px-1 py-1">
                  <option value="in">in</option><option value="ft">ft</option><option value="m">m</option>
                </select>
                <input value={r.referencePixels} onChange={e => setRow(i, { referencePixels: e.target.value })} placeholder="ref px"
                  className="w-14 bg-atlas-surface border border-atlas-border rounded px-1.5 py-1 outline-none" />
                <input value={r.targetPixels} onChange={e => setRow(i, { targetPixels: e.target.value })} placeholder="tgt px"
                  className="w-14 bg-atlas-surface border border-atlas-border rounded px-1.5 py-1 outline-none" />
              </>
            )}
            <button onClick={() => delRow(i)} className="text-atlas-muted hover:text-red-400"><X size={11} /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={addRow} className="text-[10px] text-atlas-muted hover:text-atlas-text">+ add method</button>
        <label className="flex items-center gap-1 text-[10px] text-atlas-muted cursor-pointer">
          <input type="checkbox" checked={includeFootprint} onChange={e => setIncludeFootprint(e.target.checked)} />
          + OSM footprint edge
        </label>
        <button onClick={autoMeasure} disabled={autoRunning}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-atlas-surface border border-atlas-border text-[11px] hover:border-atlas-accent disabled:opacity-50">
          {autoRunning ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />} Auto from public data
        </button>
        <button onClick={run} disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-atlas-accent text-black text-[11px] font-bold disabled:opacity-50">
          {running ? <Loader2 size={12} className="animate-spin" /> : <Ruler size={12} />} Fuse
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {measurements.map(m => (
          <div key={m.id} className={clsx('rounded-md border px-2.5 py-1.5',
            m.conflict ? 'border-red-500/40 bg-red-500/5' : 'border-atlas-border bg-atlas-surface')}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold">{m.label}</span>
              <span className="font-mono">
                {m.value?.toFixed(2)} {m.unit} {m.sigma != null && <span className="text-atlas-muted">± {m.sigma.toFixed(2)}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-atlas-muted mt-0.5">
              <span className={clsx('font-semibold', (m.confidence ?? 0) >= 70 ? 'text-green-400' : (m.confidence ?? 0) >= 40 ? 'text-yellow-400' : 'text-red-400')}>
                {m.confidence}% conf
              </span>
              {m.conflict && <span className="text-red-400">⚠ sources disagree</span>}
              <span>· {m.source_provenance?.length ?? 0} sources: {m.source_provenance?.map(s => s.source).join(', ')}</span>
            </div>
          </div>
        ))}
        {measurements.length === 0 && <p className="text-[11px] text-atlas-muted">No measurements yet.</p>}
      </div>
    </Card>
  )
}

function renderEnrichment(e: Record<string, unknown>): string {
  const parts: string[] = []
  if (typeof e.elevation_m === 'number') parts.push(`elev ${e.elevation_m.toFixed(1)}m`)
  const geo = e.geo as { state?: string; county?: string } | null
  if (geo?.county) parts.push(`${geo.county}${geo.state ? ', ' + geo.state : ''}`)
  const naip = e.naip as { available?: boolean; meters_per_pixel?: number } | undefined
  if (naip?.available) parts.push(`NAIP aerial (${naip.meters_per_pixel?.toFixed(3)} m/px)`)
  const building = e.building as { available?: boolean; building?: { longest_edge_m?: number; area_m2?: number } } | undefined
  if (building?.available && building.building) {
    parts.push(`OSM footprint: longest edge ${building.building.longest_edge_m}m, area ${building.building.area_m2}m²`)
  }
  const parcel = e.parcel as { available?: boolean } | undefined
  if (parcel) parts.push(parcel.available ? 'parcel ✓' : 'parcel: not configured')
  return parts.join(' · ') || 'none'
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-atlas-surface/40 border border-atlas-border rounded-xl p-4">{children}</div>
}
