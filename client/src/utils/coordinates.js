export const normalizeCoordinates = (value) => {
  const rawLatitude = value?.latitude
  const rawLongitude = value?.longitude
  if (rawLatitude == null || rawLongitude == null || String(rawLatitude).trim() === '' || String(rawLongitude).trim() === '') return null
  const latitude = Number(rawLatitude)
  const longitude = Number(rawLongitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  if (latitude === 0 && longitude === 0) return null

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  }
}

export const coordinatesFromPosition = (position) => normalizeCoordinates({
  latitude: position?.coords?.latitude,
  longitude: position?.coords?.longitude,
})

export const geolocationOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000,
}
