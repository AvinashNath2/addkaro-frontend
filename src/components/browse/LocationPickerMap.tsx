import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { CARTO_POSITRON, CARTO_ATTR, brandPin, ZoomControls } from '@/components/map/mapUtils'

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

// Compact rupee formatter for map popups (shows ₹50K instead of ₹50,000)
const compactFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR',
  maximumFractionDigits: 0, notation: 'compact',
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

function HoldingMarkers({ holdings }: { holdings: MapHolding[] }) {
  const navigate = useNavigate()
  return (
    <>
      {holdings.map((h) => (
        <Marker key={h.id} position={[h.latitude, h.longitude]} icon={brandPin}>
          <Popup closeButton={false} className="clean-popup">
            <div style={{ fontFamily: 'system-ui,sans-serif', minWidth: 160, padding: '4px 2px' }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#111', margin: '0 0 2px' }}>{h.title}</p>
              <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px' }}>{h.location}</p>
              <p style={{ fontSize: 11, color: '#555', fontWeight: 600, margin: '0 0 10px' }}>
                {h.distanceKm.toFixed(1)} km · {compactFmt.format(h.rentalCost)}/mo
              </p>
              <button
                onClick={() => navigate(`/holdings/${h.id}`)}
                style={{
                  background: '#1a3560', color: '#ffffff', border: 'none',
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
