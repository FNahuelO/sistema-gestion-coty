import type { LatLng } from './geo'

export type GeocodeResult = LatLng & { displayName: string }

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// Nominatim exige un User-Agent que identifique a la aplicación y un máximo de
// ~1 request por segundo. Cacheamos resultados y serializamos los pedidos para
// respetar esa política.
const USER_AGENT =
  process.env.GEOCODING_USER_AGENT ??
  'CotyCafeDelivery/1.0 (contacto: admin@cotycafe.local)'

// Sesgo geográfico opcional para mejorar la precisión (formato: lat,lng).
const DEFAULT_BIAS = process.env.GEOCODING_BIAS_LATLNG ?? ''
const COUNTRY_CODES = process.env.GEOCODING_COUNTRY_CODES ?? 'ar'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MIN_INTERVAL_MS = 1100

type CacheEntry = { result: GeocodeResult | null; expiresAt: number }
const cache = new Map<string, CacheEntry>()

let lastRequestAt = 0
let queue: Promise<unknown> = Promise.resolve()

function normalizeKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function throttle(): Promise<void> {
  const now = Date.now()
  const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - now)
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait))
  }
  lastRequestAt = Date.now()
}

async function requestNominatim(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    addressdetails: '0',
  })
  if (COUNTRY_CODES) params.set('countrycodes', COUNTRY_CODES)

  const biasParts = DEFAULT_BIAS.split(',').map((value) => Number(value.trim()))
  if (biasParts.length === 2 && biasParts.every(Number.isFinite)) {
    const [lat, lng] = biasParts
    const delta = 0.5
    params.set(
      'viewbox',
      `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`
    )
    params.set('bounded', '0')
  }

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'es',
    },
  })

  if (!response.ok) {
    throw new Error(`GEOCODING_HTTP_${response.status}`)
  }

  const data = (await response.json()) as Array<{
    lat: string
    lon: string
    display_name: string
  }>

  if (!Array.isArray(data) || data.length === 0) return null

  const [first] = data
  const lat = Number(first.lat)
  const lng = Number(first.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return { lat, lng, displayName: first.display_name }
}

/**
 * Geocodifica una dirección a coordenadas usando OpenStreetMap / Nominatim.
 * Devuelve `null` si no se encuentra. Cachea por 24h y respeta el rate limit.
 */
export async function geocodeAddress(rawQuery: string): Promise<GeocodeResult | null> {
  const query = rawQuery.trim()
  if (query.length < 4) return null

  const key = normalizeKey(query)
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result
  }

  const run = queue.then(async () => {
    const fresh = cache.get(key)
    if (fresh && fresh.expiresAt > Date.now()) return fresh.result
    await throttle()
    const result = await requestNominatim(query)
    cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS })
    return result
  })

  // Mantener la cadena viva aunque este request falle.
  queue = run.catch(() => undefined)
  return run
}
