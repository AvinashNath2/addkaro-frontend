import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { WishlistItem } from '@/types'

// Fix Vite asset-handling breaking leaflet's default icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

function formatRupees(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(n)
}

function priceIcon(price: number) {
  const label = formatRupees(price)
  return L.divIcon({
    className: '',
    html: `<div style="background:#C9F31D;color:#111;border-radius:20px;padding:3px 8px;white-space:nowrap;font-size:11px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid rgba(0,0,0,0.08);">${label}<span style="font-size:9px;font-weight:500">/mo</span></div>`,
    iconSize: undefined,
    iconAnchor: [30, 14],
    popupAnchor: [0, -20],
  })
}

function FitBounds({ items }: { items: Array<{ lat: number; lng: number }> }) {
  const map = useMap()
  useEffect(() => {
    if (items.length === 0) return
    if (items.length === 1) {
      map.setView([items[0].lat, items[0].lng], 13)
    } else {
      const bounds = L.latLngBounds(items.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [48, 48] })
    }
  }, [map, items])
  return null
}

export default function WishlistMap({ items }: { items: WishlistItem[] }) {
  const navigate = useNavigate()
  const mapped = items.filter(i => i.latitude != null && i.longitude != null) as Array<WishlistItem & { latitude: number; longitude: number }>

  const centerLat = mapped.length > 0 ? mapped[0].latitude : 20.5937
  const centerLng = mapped.length > 0 ? mapped[0].longitude : 78.9629

  return (
    <div>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={mapped.length === 1 ? 13 : 5}
        style={{ height: 520, borderRadius: 16, zIndex: 0 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds items={mapped.map(i => ({ lat: i.latitude, lng: i.longitude }))} />
        {mapped.map(item => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={priceIcon(item.rentalCost ?? 0)}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>{item.location}</p>
                <button
                  onClick={() => navigate(`/browse/${item.holdingId}`)}
                  style={{ background: '#C9F31D', color: '#111', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%' }}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {mapped.length < items.length && (
        <p className="text-xs text-gray-400 text-center mt-2">
          {items.length - mapped.length} hoarding{items.length - mapped.length !== 1 ? 's' : ''} not shown — coordinates not available.
        </p>
      )}
    </div>
  )
}
