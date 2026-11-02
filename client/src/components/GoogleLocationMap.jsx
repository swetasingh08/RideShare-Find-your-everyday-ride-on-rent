import React, { useEffect, useRef, useState } from 'react'

let googleMapsPromise

const loadGoogleMaps = apiKey => {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const callbackName = `rideShareGoogleMaps${Date.now()}`
      window[callbackName] = () => {
        delete window[callbackName]
        resolve(window.google.maps)
      }
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}`
      script.async = true
      script.defer = true
      script.onerror = () => {
        delete window[callbackName]
        googleMapsPromise = null
        reject(new Error('Google Maps could not be loaded'))
      }
      document.head.appendChild(script)
    })
  }
  return googleMapsPromise
}

const GoogleLocationMap = ({ center, points, cars, userCoordinates, userLabel, markers, routePoints, onSelect, onMapClick }) => {
  const mapElement = useRef(null)
  const mapObject = useRef(null)
  const overlays = useRef([])
  const [loadError, setLoadError] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    let active = true
    if (!apiKey) return undefined
    loadGoogleMaps(apiKey).then(maps => {
      if (!active || !mapElement.current) return
      mapObject.current = new maps.Map(mapElement.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: points.length > 1 ? 12 : 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      })
      setMapReady(true)
    }).catch(() => { if (active) setLoadError(true) })
    return () => { active = false }
  }, [apiKey])

  useEffect(() => {
    const map = mapObject.current
    const maps = window.google?.maps
    if (!map || !maps || !mapReady) return undefined

    overlays.current.forEach(overlay => overlay.setMap(null))
    overlays.current = []
    const addMarker = (position, options = {}) => {
      const marker = new maps.Marker({ map, position: { lat: position[0], lng: position[1] }, ...options })
      overlays.current.push(marker)
      return marker
    }

    if (userCoordinates) addMarker([userCoordinates.latitude, userCoordinates.longitude], { title: userLabel, icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' })
    markers.forEach(marker => addMarker([marker.coordinates.latitude, marker.coordinates.longitude], {
      title: marker.label,
      label: marker.kind === 'drop' ? 'D' : 'P',
      icon: { path: maps.SymbolPath.CIRCLE, scale: 12, fillColor: marker.kind === 'drop' ? '#dc2626' : '#f59e0b', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
    }))
    cars.forEach(car => {
      const marker = addMarker([car.coordinates.latitude, car.coordinates.longitude], { title: `${car.brand} ${car.model}` })
      if (onSelect) marker.addListener('click', () => onSelect(car))
    })
    if (routePoints.length > 1) overlays.current.push(new maps.Polyline({ map, path: routePoints.map(([lat, lng]) => ({ lat, lng })), strokeColor: '#15947c', strokeOpacity: 0.9, strokeWeight: 4 }))

    if (points.length > 1) {
      const bounds = new maps.LatLngBounds()
      points.forEach(([lat, lng]) => bounds.extend({ lat, lng }))
      map.fitBounds(bounds, 28)
      maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 14) map.setZoom(14)
      })
    } else {
      map.setCenter({ lat: center[0], lng: center[1] })
      map.setZoom(points.length ? 16 : 5)
    }
    return () => {
      overlays.current.forEach(overlay => overlay.setMap(null))
      overlays.current = []
    }
  }, [center, cars, markers, onSelect, points, routePoints, userCoordinates, userLabel, mapReady])

  useEffect(() => {
    const map = mapObject.current
    const maps = window.google?.maps
    if (!map || !maps || !mapReady || !onMapClick) return undefined
    const listener = map.addListener('click', event => onMapClick({ latitude: Number(event.latLng.lat().toFixed(6)), longitude: Number(event.latLng.lng().toFixed(6)) }))
    return () => listener.remove()
  }, [onMapClick, loadError, mapReady])

  return <div className='h-80 w-full' ref={mapElement} role='application' aria-label='Google map'>{loadError && <div className='flex h-full items-center justify-center text-sm text-red-600'>Google Maps failed to load. Check the browser API key and allowed referrers.</div>}</div>
}

export default GoogleLocationMap
