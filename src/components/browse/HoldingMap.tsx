import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { CARTO_POSITRON, CARTO_ATTR, brandPinLarge, ZoomControls } from '@/components/map/mapUtils'

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
      <Marker position={[lat, lng]} icon={brandPinLarge}>
        <Popup closeButton={false} className="clean-popup">
          <div style={{ fontFamily: 'system-ui, sans-serif', padding: '6px 4px', minWidth: 140 }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: '#111', margin: 0 }}>{title}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
