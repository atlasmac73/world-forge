'use client'

/**
 * ATLAS v67 — PropertyMap Component
 * Mapbox-powered property map for D4D and AIN.
 * Gracefully degrades to pin-list when NEXT_PUBLIC_MAPBOX_TOKEN is not set.
 * Adapted from V20 AUTOPOIETIC — server-safe, no client-side secrets.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

interface MapPin {
  id: string
  latitude: number
  longitude: number
  label?: string
  color?: string
  score?: number
  address?: string
  onClick?: () => void
}

interface PropertyMapProps {
  pins?: MapPin[]
  center?: [number, number]  // [lng, lat]
  zoom?: number
  height?: string
  className?: string
  onPinClick?: (pin: MapPin) => void
  onMapClick?: (coords: { lat: number; lng: number }) => void
  showControls?: boolean
}

// Default center: Charleston WV
const DEFAULT_CENTER: [number, number] = [-81.6326, 38.3498]
const DEFAULT_ZOOM = 10

const PIN_COLORS: Record<number, string> = {
  80: '#fc8181',  // CRITICAL — red
  65: '#f6ad55',  // HOT — gold
  45: '#63b3ed',  // WARM — cyan
  25: '#4fd1c5',  // COOL — teal
  0:  '#718096',  // COLD — gray
}

function getPinColor(score?: number): string {
  if (!score) return '#718096'
  const threshold = Object.keys(PIN_COLORS)
    .map(Number)
    .sort((a, b) => b - a)
    .find(t => score >= t)
  return PIN_COLORS[threshold ?? 0]
}

export function PropertyMap({
  pins = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '400px',
  className,
  onPinClick,
  onMapClick,
  showControls = true,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const hasMapbox = Boolean(mapboxToken)

  useEffect(() => {
    if (!hasMapbox || !mapRef.current) return

    let mapInstance: unknown = null

    const initMap = async () => {
      try {
        // Dynamic import — only loads when token is present
        const mapboxgl = await import('mapbox-gl').catch(() => null)
        if (!mapboxgl) {
          setError('mapbox-gl not installed')
          return
        }

        mapboxgl.default.accessToken = mapboxToken

        const map = new mapboxgl.default.Map({
          container: mapRef.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center,
          zoom,
        })

        mapInstance = map

        map.on('load', () => {
          setMapLoaded(true)

          // Add pins
          pins.forEach(pin => {
            const el = document.createElement('div')
            el.style.cssText = `
              width: 24px; height: 24px; border-radius: 50%;
              background: ${getPinColor(pin.score)};
              border: 2px solid white;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            `
            el.onclick = () => {
              setSelectedPin(pin)
              onPinClick?.(pin)
              pin.onClick?.()
            }

            new mapboxgl.default.Marker({ element: el })
              .setLngLat([pin.longitude, pin.latitude])
              .addTo(map)
          })
        })

        map.on('click', (e: { lngLat: { lat: number; lng: number } }) => {
          onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        })

        map.on('error', () => setError('Map load error'))

      } catch (err) {
        setError('Failed to initialize map')
      }
    }

    initMap()

    return () => {
      // @ts-expect-error -- cleanup
      mapInstance?.remove?.()
    }
  }, [hasMapbox, center[0], center[1], zoom])

  // Fallback: no Mapbox token — show pin list
  if (!hasMapbox) {
    return (
      <div className={clsx('rounded-xl border border-atlas-border bg-atlas-panel', className)} style={{ minHeight: height }}>
        <div className="p-4 border-b border-atlas-border flex items-center gap-2">
          <Navigation size={13} className="text-atlas-muted" />
          <span className="text-xs text-atlas-muted">Map unavailable — set NEXT_PUBLIC_MAPBOX_TOKEN to enable</span>
        </div>
        {pins.length > 0 ? (
          <div className="divide-y divide-white/5 overflow-y-auto" style={{ maxHeight: height }}>
            {pins.map(pin => (
              <button
                key={pin.id}
                onClick={() => { setSelectedPin(pin); onPinClick?.(pin); pin.onClick?.() }}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/4 transition-colors',
                  selectedPin?.id === pin.id && 'bg-white/6'
                )}
              >
                <MapPin size={13} style={{ color: getPinColor(pin.score) }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-atlas-text truncate">
                    {pin.address ?? pin.label ?? `${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}`}
                  </p>
                  {pin.score !== undefined && (
                    <p className="text-[10px] text-atlas-muted">Score: {pin.score}</p>
                  )}
                </div>
                {pin.score !== undefined && (
                  <span className="text-xs font-mono font-bold ml-auto shrink-0" style={{ color: getPinColor(pin.score) }}>
                    {pin.score}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center space-y-2">
              <MapPin size={24} className="text-atlas-muted mx-auto" />
              <p className="text-xs text-atlas-muted">No properties to display</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={clsx('relative rounded-xl overflow-hidden', className)} style={{ height }}>
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading state */}
      {!mapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-atlas-dark">
          <div className="text-center space-y-2">
            <div className="w-6 h-6 border-2 border-atlas-teal border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-atlas-muted">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-atlas-dark">
          <div className="text-center space-y-2 px-4">
            <AlertTriangle size={24} className="text-atlas-gold mx-auto" />
            <p className="text-xs text-atlas-muted">{error}</p>
          </div>
        </div>
      )}

      {/* Selected pin popup */}
      {selectedPin && (
        <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-atlas-border bg-[rgba(10,14,26,0.95)] p-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-atlas-text">
                {selectedPin.address ?? selectedPin.label}
              </p>
              {selectedPin.score !== undefined && (
                <p className="text-[10px] text-atlas-muted">
                  Distress Score: <span style={{ color: getPinColor(selectedPin.score) }}>{selectedPin.score}</span>
                </p>
              )}
            </div>
            <button onClick={() => setSelectedPin(null)} className="text-atlas-muted hover:text-atlas-text text-xs">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
