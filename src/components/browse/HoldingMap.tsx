import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
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

// ── CartoDB Positron — minimal, clean tile layer (no cluttered OSM details) ──
const CARTO_POSITRON = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

// Brand-yellow teardrop pin
const holdingPin = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:36px;height:46px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.22));">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 11.6 18 28 18 28S36 29.6 36 18C36 8.06 27.94 0 18 0z" fill="#C9F31D"/>
        <circle cx="18" cy="17" r="8" fill="#111111"/>
        <circle cx="18" cy="17" r="3.5" fill="#C9F31D"/>
      </svg>
    </div>`,
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -50],
})

interface HoldingMapProps {
  lat: number
  lng: number
  title: string
}

export default function HoldingMap({ lat, lng, title }: HoldingMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <TileLayer url={CARTO_POSITRON} attribution={CARTO_ATTR} />
      <ZoomControls />
      <Marker position={[lat, lng]} icon={holdingPin}>
        <Popup
          closeButton={false}
          className="clean-popup"
        >
          <div style={{
            fontFamily: 'system-ui, sans-serif',
            padding: '6px 4px',
            minWidth: 140,
          }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: '#111', margin: 0 }}>{title}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
