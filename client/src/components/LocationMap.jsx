import React, { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { normalizeCoordinates } from '../utils/coordinates'

const fallbackCenter = [12.9716, 77.5946]

const vehicleIcon = L.divIcon({
  className: 'rideshare-map-marker',
  html: '<div style="background:#15947c;color:white;border:3px solid white;border-radius:999px;width:30px;height:30px;display:grid;place-items:center;box-shadow:0 2px 8px #0004">🚗</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

const userIcon = L.divIcon({
  className: 'rideshare-user-marker',
  html: '<div style="background:#2563eb;border:4px solid white;border-radius:999px;width:18px;height:18px;box-shadow:0 2px 8px #0004"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const pickupIcon = L.divIcon({
  className: 'rideshare-pickup-marker',
  html: '<div style="background:#f59e0b;color:white;border:3px solid white;border-radius:999px;width:28px;height:28px;display:grid;place-items:center;box-shadow:0 2px 8px #0004;font-weight:700">P</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const dropIcon = L.divIcon({
  className: 'rideshare-drop-marker',
  html: '<div style="background:#dc2626;color:white;border:3px solid white;border-radius:999px;width:28px;height:28px;display:grid;place-items:center;box-shadow:0 2px 8px #0004;font-weight:700">D</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const MapViewport = ({ center, points }) => {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 14, animate: true })
    else map.setView(center, map.getZoom(), { animate: true })
  }, [center, map, points])
  return null
}

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: event => onMapClick({ latitude: Number(event.latlng.lat.toFixed(6)), longitude: Number(event.latlng.lng.toFixed(6)) }) })
  return null
}

const LocationMap = ({ cars = [], userLocation, userLabel = 'Your location', routeCoordinates = [], locationMarkers = [], onSelect, onMapClick }) => {
  const mappableCars = useMemo(() => cars.map(car => {
    const coordinates = normalizeCoordinates(car.coordinates)
    return coordinates ? { ...car, coordinates } : null
  }).filter(Boolean), [cars])
  const mappableMarkers = useMemo(() => locationMarkers.map(marker => {
    const coordinates = normalizeCoordinates(marker.coordinates)
    return coordinates ? { ...marker, coordinates } : null
  }).filter(Boolean), [locationMarkers])
  const markerPoints = mappableMarkers.map(marker => [marker.coordinates.latitude, marker.coordinates.longitude])
  const routePoints = routeCoordinates.map(point => {
    const coordinates = Array.isArray(point) ? { latitude: point[0], longitude: point[1] } : point
    const normalized = normalizeCoordinates(coordinates)
    return normalized ? [normalized.latitude, normalized.longitude] : null
  }).filter(Boolean)
  const userCoordinates = normalizeCoordinates(userLocation)
  const userPoint = useMemo(() => userCoordinates ? [userCoordinates.latitude, userCoordinates.longitude] : null, [userCoordinates])
  const carPoints = mappableCars.map(car => [car.coordinates.latitude, car.coordinates.longitude])
  const points = useMemo(() => [...markerPoints, ...routePoints, ...(userPoint ? [userPoint] : []), ...carPoints], [carPoints, markerPoints, routePoints, userPoint])
  const center = userPoint || markerPoints[0] || (mappableCars.length ? carPoints[0] : fallbackCenter)

  return <div className='h-80 overflow-hidden rounded-xl border border-borderColor shadow-sm'>
    <MapContainer center={center} zoom={userLocation || mappableCars.length || markerPoints.length ? 12 : 5} scrollWheelZoom className='h-full w-full'>
      <MapViewport center={center} points={points} />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      <TileLayer attribution='&copy; OpenStreetMap contributors' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
      {routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: '#15947c', weight: 4 }} />}
      {userCoordinates && <Marker position={[userCoordinates.latitude, userCoordinates.longitude]} icon={userIcon}><Popup>{userLabel}</Popup></Marker>}
      {mappableMarkers.map(marker => <Marker key={marker.id || marker.label} position={[marker.coordinates.latitude, marker.coordinates.longitude]} icon={marker.kind === 'drop' ? dropIcon : pickupIcon}><Popup>{marker.label}</Popup></Marker>)}
      {mappableCars.map(car => <Marker key={car._id} position={[Number(car.coordinates.latitude), Number(car.coordinates.longitude)]} icon={vehicleIcon} eventHandlers={{ click: () => onSelect?.(car) }}>
        <Popup><div className='min-w-36'><p className='font-semibold'>{car.brand} {car.model}</p><p className='text-xs text-gray-500'>{car.location} · {car.pricePerDay}/day</p>{car.distanceKm != null && <p className='text-xs text-primary'>{car.distanceKm} km away</p>}<button type='button' onClick={() => onSelect?.(car)} className='mt-2 text-xs font-medium text-primary'>View vehicle</button></div></Popup>
      </Marker>)}
    </MapContainer>
  </div>
}

export default LocationMap
