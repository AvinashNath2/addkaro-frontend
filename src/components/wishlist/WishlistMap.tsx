import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { CARTO_POSITRON, CARTO_ATTR, brandPin, ZoomControls } from '@/components/map/mapUtils'
import { formatRupees } from '@/lib/formatters'
import type { WishlistItem } from '@/types/index'

function FitBounds({ items }: { items: WishlistItem[] }) {
  const map = useMap()
  useEffect(() => {
    const pts = items.filter(i => i.latitude != null && i.longitude != null)
    if (pts.length === 0) return
    if (pts.length === 1) {
      map.setView([pts[0].latitude!, pts[0].longitude!], 14)
      return
    }
    const bounds = L.latLngBounds(pts.map(i => [i.latitude!, i.longitude!] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48] })
  }, [map, items])
  return null
}

interface WishlistMapProps {
  items: WishlistItem[]
}

export default function WishlistMap({ items }: WishlistMapProps) {
  const navigate = useNavigate()
  const mapped = items.filter(i => i.latitude != null && i.longitude != null)
  const center: [number, number] = mapped.length
    ? [mapped[0].latitude!, mapped[0].longitude!]
    : [20.5937, 78.9629]

  return (
    <div style={{ height: 520, position: 'relative', borderRadius: 0 }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <TileLayer url={CARTO_POSITRON} attribution={CARTO_ATTR} />
        <FitBounds items={items} />
        <ZoomControls />
        {mapped.map(item => (
          <Marker key={item.holdingId} position={[item.latitude!, item.longitude!]} icon={brandPin}>
            <Popup closeButton={false} className="clean-popup">
              <div style={{ fontFamily: 'system-ui, sans-serif', padding: '6px 4px', minWidth: 160 }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: '#111', margin: '0 0 4px' }}>{item.title}</p>
                <p style={{ fontSize: 11, color: '#666', margin: '0 0 6px' }}>{item.location}</p>
                {item.rentalCost != null && (
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1a3560', margin: '0 0 8px' }}>
                    {formatRupees(item.rentalCost)}/mo
                  </p>
                )}
                <button
                  onClick={() => navigate(`/holdings/${item.holdingId}`)}
                  style={{
                    width: '100%', padding: '5px 0', fontSize: 11, fontWeight: 700,
                    background: '#1a3560', color: 'white', border: 'none', cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  VIEW DETAILS →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
