import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'

function ZoomControls() {
  const map = useMap()
  const btn = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'white', border: 'none', cursor: 'pointer',
        fontSize: 20, fontWeight: 300, color: '#333', lineHeight: 1,
        fontFamily: 'system-ui, sans-serif',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
    >
      {label}
    </button>
  )
  return (
    <div style={{
      position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      {btn('+', () => map.zoomIn())}
      <div style={{ height: 1, background: '#e5e7eb' }} />
      {btn('−', () => map.zoomOut())}
    </div>
  )
}

// ── CartoDB Positron — minimal clean tiles ────────────────────────────────────
const CARTO_POSITRON = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

// Brand-yellow teardrop for hoarding markers
const holdingPin = L.divIcon({
  className: '',
  html: `
    <div style="filter:drop-shadow(0 4px 10px rgba(0,0,0,0.2));">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 10.4 16 26 16 26S32 26.4 32 16C32 7.16 24.84 0 16 0z" fill="#C9F31D"/>
        <circle cx="16" cy="15" r="7" fill="#111111"/>
        <circle cx="16" cy="15" r="3" fill="#C9F31D"/>
      </svg>
    </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -46],
})

// Blue pulsing dot for the selected center point
const centerPin = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        position:absolute;inset:0;
        background:rgba(59,130,246,0.2);
        border-radius:50%;
        animation:pulse 2s infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:12px;height:12px;
        background:#3b82f6;border-radius:50%;
        border:2.5px solid white;
        box-shadow:0 2px 6px rgba(59,130,246,0.5);
      "></div>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface LatLng { lat: number; lng: number }

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
    click(e) { onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng }) },
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
    style: 'currency', currency: 'INR',
    maximumFractionDigits: 0, notation: 'compact',
  }).format(amount)
}

function HoldingMarkers({ holdings }: { holdings: MapHolding[] }) {
  const navigate = useNavigate()
  return (
    <>
      {holdings.map((h) => (
        <Marker key={h.id} position={[h.latitude, h.longitude]} icon={holdingPin}>
          <Popup closeButton={false} className="clean-popup">
            <div style={{ fontFamily: 'system-ui,sans-serif', minWidth: 160, padding: '4px 2px' }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#111', margin: '0 0 2px' }}>{h.title}</p>
              <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px' }}>{h.location}</p>
              <p style={{ fontSize: 11, color: '#555', fontWeight: 600, margin: '0 0 10px' }}>
                {h.distanceKm.toFixed(1)} km · {formatRupees(h.rentalCost)}/mo
              </p>
              <button
                onClick={() => navigate(`/holdings/${h.id}`)}
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
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={CARTO_POSITRON} attribution={CARTO_ATTR} />
      <ZoomControls />
      <Marker position={[center.lat, center.lng]} icon={centerPin} />
      {holdings.length > 0 && <HoldingMarkers holdings={holdings} />}
      <ClickHandler onLocationChange={onLocationChange} />
      <MapCenterUpdater center={center} />
    </MapContainer>
  )
}
