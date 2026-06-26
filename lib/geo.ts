export type LatLng = { lat: number; lng: number }

export type ZoneGeometry = {
  id: string
  name: string
  deliveryFee: number
  minOrderAmount: number
  geoType: 'RADIUS' | 'POLYGON'
  centerLat?: number | null
  centerLng?: number | null
  radiusKm?: number | null
  polygon?: LatLng[] | null
}

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Distancia en kilómetros entre dos puntos (fórmula de Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Determina si un punto está dentro de un círculo (centro + radio en km). */
export function isPointInCircle(point: LatLng, center: LatLng, radiusKm: number): boolean {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return false
  return haversineKm(point, center) <= radiusKm
}

/**
 * Determina si un punto está dentro de un polígono (ray casting).
 * El polígono es una lista de vértices {lat,lng}; no hace falta cerrarlo.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (!Array.isArray(polygon) || polygon.length < 3) return false

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }
  return inside
}

/** Indica si un punto cae dentro de una zona según su tipo de geometría. */
export function isPointInZone(point: LatLng, zone: ZoneGeometry): boolean {
  if (zone.geoType === 'POLYGON') {
    return isPointInPolygon(point, zone.polygon ?? [])
  }
  if (
    zone.centerLat == null ||
    zone.centerLng == null ||
    zone.radiusKm == null
  ) {
    return false
  }
  return isPointInCircle(point, { lat: zone.centerLat, lng: zone.centerLng }, zone.radiusKm)
}

/**
 * Devuelve la zona que cubre el punto. Si varias coinciden, prioriza la de
 * menor costo de envío (mejor opción para el cliente).
 */
export function findMatchingZone(point: LatLng, zones: ZoneGeometry[]): ZoneGeometry | null {
  const matches = zones.filter((zone) => isPointInZone(point, zone))
  if (matches.length === 0) return null
  return matches.reduce((best, current) =>
    current.deliveryFee < best.deliveryFee ? current : best
  )
}
