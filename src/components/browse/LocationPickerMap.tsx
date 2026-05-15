import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Custom icon for hoarding markers — indigo circle with "H"
const holdingIcon = L.divIcon({
  className: '',
  html: `<div style="background:#4f46e5;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);font-size:13px;font-weight:700;border:2px solid white;">H</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -18],
})

interface LatLng {
  lat: number
  lng: number
}

export interface MapHolding {
  id: string
  title: string
  location: string
  latitude: number
  longitude: number
  distanceKm: number
  rentalCost: number
}

interface LocationPickerMapProps {
  center: LatLng
  onLocationChange: (coords: LatLng) => void
  height?: string
  holdings?: MapHolding[]
}

function ClickHandler({ onLocationChange }: { onLocationChange: (c: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function MapCenterUpdater({ center }: { center: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Inner component so useNavigate works inside MapContainer context
function HoldingMarkers({ holdings }: { holdings: MapHolding[] }) {
  const navigate = useNavigate()
  return (
    <>
      {holdings.map((h) => (
        <Marker
          key={h.id}
          position={[h.latitude, h.longitude]}
          icon={holdingIcon}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{h.title}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{h.location}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                {h.distanceKm.toFixed(1)} km · {formatRupees(h.rentalCost)}/mo
              </p>
              <button
                onClick={() => navigate(`/holdings/${h.id}`)}
                style={{
                  background: '#4f46e5', color: 'white', border: 'none',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12,
                  cursor: 'pointer', width: '100%',
                }}
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default function LocationPickerMap({
  center,
  onLocationChange,
  height = '320px',
  holdings = [],
}: LocationPickerMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height, width: '100%', borderRadius: '12px' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Center pin — shows current search point */}
      <Marker position={[center.lat, center.lng]} />

      {/* Hoarding markers */}
      {holdings.length > 0 && <HoldingMarkers holdings={holdings} />}

      <ClickHandler onLocationChange={onLocationChange} />
      <MapCenterUpdater center={center} />
    </MapContainer>
  )
}
