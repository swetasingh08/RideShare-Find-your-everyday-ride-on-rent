export const normalizeCoordinates = (value) => {
  const latitude = Number(value?.latitude)
  const longitude = Number(value?.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null

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
