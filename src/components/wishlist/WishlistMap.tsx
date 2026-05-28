import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import type { WishlistItem } from '@/types'

// ── CartoDB Positron — minimal clean tiles ────────────────────────────────────
const CARTO_POSITRON = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

function formatCompact(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    maximumFractionDigits: 0, notation: 'compact',
  }).format(n)
}

function pricePin(price: number) {
  const label = formatCompact(price)
  return L.divIcon({
    className: '',
    html: `
      <div style="
        display:inline-flex;align-items:center;gap:3px;
        background:#C9F31D;color:#111;
        border-radius:20px;padding:5px 10px;
        white-space:nowrap;font-size:11px;font-weight:800;
        box-shadow:0 3px 10px rgba(0,0,0,0.18);
        border:2px solid rgba(255,255,255,0.9);
        font-family:system-ui,sans-serif;
        position:relative;
      ">
        ${label}<span style="font-size:9px;opacity:0.65;font-weight:600">/mo</span>
        <div style="
          position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:7px solid #C9F31D;
        "></div>
      </div>`,
    iconSize: undefined,
    iconAnchor: [36, 28],
    popupAnchor: [0, -32],
  })
}

function FitBounds({ items }: { items: Array<{ lat: number; lng: number }> }) {
  const map = useMap()
  useEffect(() => {
    if (items.length === 0) return
    if (items.length === 1) {
      map.setView([items[0].lat, items[0].lng], 14)
    } else {
      const bounds = L.latLngBounds(items.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [56, 56] })
    }
  }, [map, items])
  return null
}

export default function WishlistMap({ items }: { items: WishlistItem[] }) {
  const navigate = useNavigate()
  const mapped = items.filter(
    i => i.latitude != null && i.longitude != null,
  ) as Array<WishlistItem & { latitude: number; longitude: number }>

  const centerLat = mapped.length > 0 ? mapped[0].latitude : 20.5937
  const centerLng = mapped.length > 0 ? mapped[0].longitude : 78.9629

  return (
    <div>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={mapped.length === 1 ? 14 : 5}
        style={{ height: 520, borderRadius: 16, zIndex: 0 }}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={CARTO_POSITRON} attribution={CARTO_ATTR} />
        <FitBounds items={mapped.map(i => ({ lat: i.latitude, lng: i.longitude }))} />
        {mapped.map(item => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={pricePin(item.rentalCost ?? 0)}
          >
            <Popup closeButton={false} className="clean-popup">
              <div style={{ fontFamily: 'system-ui,sans-serif', minWidth: 160, padding: '4px 2px' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#111', margin: '0 0 3px' }}>{item.title}</p>
                <p style={{ fontSize: 11, color: '#888', margin: '0 0 10px' }}>{item.location}</p>
                <button
                  onClick={() => navigate(`/holdings/${item.holdingId}`)}
                  style={{
                    background: '#C9F31D', color: '#111', border: 'none',
                    borderRadius: 8, padding: '6px 0', fontSize: 11,
                    fontWeight: 800, cursor: 'pointer', width: '100%',
                    fontFamily: 'system-ui,sans-serif',
                  }}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {mapped.length < items.length && (
        <p className="text-xs text-gray-400 text-center mt-2">
          {items.length - mapped.length} hoarding{items.length - mapped.length !== 1 ? 's' : ''} not shown — coordinates unavailable.
        </p>
      )}
    </div>
  )
}
