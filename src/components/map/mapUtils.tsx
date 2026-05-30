import { useMap } from 'react-leaflet'
import L from 'leaflet'

export const CARTO_POSITRON = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
export const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

// Standard pin (32×42) — used for lists of markers
export const brandPin = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.25));">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 10.4 16 26 16 26S32 26.4 32 16C32 7.16 24.84 0 16 0z" fill="#1a3560"/>
      <circle cx="16" cy="15" r="7" fill="white"/>
      <circle cx="16" cy="15" r="3" fill="#1a3560"/>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -46],
})

// Large pin (36×46) — used for single-location detail maps
export const brandPinLarge = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:36px;height:46px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.22));">
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 11.6 18 28 18 28S36 29.6 36 18C36 8.06 27.94 0 18 0z" fill="#1a3560"/>
      <circle cx="18" cy="17" r="8" fill="white"/>
      <circle cx="18" cy="17" r="3.5" fill="#1a3560"/>
    </svg>
  </div>`,
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -50],
})

const btnStyle: React.CSSProperties = {
  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'white', border: 'none', cursor: 'pointer',
  fontSize: 20, fontWeight: 300, color: '#333', lineHeight: 1,
  fontFamily: 'system-ui, sans-serif', transition: 'background 0.15s',
}

export function ZoomControls() {
  const map = useMap()
  return (
    <div style={{
      position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      <button
        style={btnStyle}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
        onClick={() => map.zoomIn()}
      >+</button>
      <div style={{ height: 1, background: '#e5e7eb' }} />
      <button
        style={btnStyle}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
        onClick={() => map.zoomOut()}
      >−</button>
    </div>
  )
}
