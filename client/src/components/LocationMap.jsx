import React, { useMemo } from 'react'
import { normalizeCoordinates } from '../utils/coordinates'
import GoogleLocationMap from './GoogleLocationMap'

const fallbackCenter = [12.9716, 77.5946]

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
  const userPoint = userCoordinates ? [userCoordinates.latitude, userCoordinates.longitude] : null
  const carPoints = mappableCars.map(car => [car.coordinates.latitude, car.coordinates.longitude])
  const points = [...markerPoints, ...routePoints, ...(userPoint ? [userPoint] : []), ...carPoints]
  const center = userPoint || markerPoints[0] || carPoints[0] || fallbackCenter

  return <div className='h-80 overflow-hidden rounded-xl border border-borderColor shadow-sm'>
    <GoogleLocationMap center={center} points={points} cars={mappableCars} userCoordinates={userCoordinates} userLabel={userLabel} markers={mappableMarkers} routePoints={routePoints} onSelect={onSelect} onMapClick={onMapClick} />
  </div>
}

export default LocationMap
