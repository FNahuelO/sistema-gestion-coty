import type { LatLng } from './geo'

export type GeocodeResult = LatLng & {
  displayName: string
  /** True cuando no hay número de puerta (sugerencia a completar). */
  approximate?: boolean
  /** Proveedor que resolvió el resultado. */
  provider?: 'google' | 'nominatim'
}

type NominatimAddress = {
  house_number?: string
  road?: string
  pedestrian?: string
  path?: string
  neighbourhood?: string
  suburb?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state_district?: string
  state?: string
}

type GoogleAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GoogleGeocodeResult = {
  formatted_address?: string
  geometry?: { location?: { lat: number; lng: number } }
  address_components?: GoogleAddressComponent[]
  partial_match?: boolean
  types?: string[]
}

type GoogleGeocodeResponse = {
  status: string
  results?: GoogleGeocodeResult[]
  error_message?: string
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

const USER_AGENT =
  process.env.GEOCODING_USER_AGENT ??
  'CotyCafeDelivery/1.0 (contacto: admin@cotycafe.local)'

const DEFAULT_BIAS = process.env.GEOCODING_BIAS_LATLNG ?? ''
const COUNTRY_CODES = process.env.GEOCODING_COUNTRY_CODES ?? 'ar'
const GOOGLE_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY?.trim() ||
  process.env.GOOGLE_GEOCODING_API_KEY?.trim() ||
  ''

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MIN_INTERVAL_MS = 1100

type CacheEntry = { result: GeocodeResult | null; expiresAt: number }
const cache = new Map<string, CacheEntry>()

let lastNominatimAt = 0
let nominatimQueue: Promise<unknown> = Promise.resolve()

function normalizeKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

function reverseCacheKey(lat: number, lng: number): string {
  return `rev:${lat.toFixed(5)},${lng.toFixed(5)}`
}

function hasGoogleKey(): boolean {
  return GOOGLE_API_KEY.length > 0
}

async function throttleNominatim(): Promise<void> {
  const now = Date.now()
  const wait = Math.max(0, lastNominatimAt + MIN_INTERVAL_MS - now)
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait))
  }
  lastNominatimAt = Date.now()
}

function pickComponent(
  components: GoogleAddressComponent[] | undefined,
  ...types: string[]
): string | undefined {
  if (!components?.length) return undefined
  for (const type of types) {
    const match = components.find((c) => c.types.includes(type))
    if (match?.long_name?.trim()) return match.long_name.trim()
  }
  return undefined
}

function formatGoogleDeliveryAddress(result: GoogleGeocodeResult): {
  displayName: string
  approximate: boolean
} | null {
  const components = result.address_components
  const streetNumber = pickComponent(components, 'street_number')
  const route = pickComponent(components, 'route')
  const streetLine = route
    ? streetNumber
      ? `${route} ${streetNumber}`
      : route
    : undefined

  const locality =
    pickComponent(
      components,
      'neighborhood',
      'sublocality_level_1',
      'sublocality',
      'sublocality_level_2'
    ) || undefined

  const city =
    pickComponent(
      components,
      'locality',
      'postal_town',
      'administrative_area_level_2'
    ) || undefined

  const parts = [streetLine, locality, city].filter(
    (part): part is string => Boolean(part && part.trim())
  )

  if (parts.length > 0) {
    return {
      displayName: parts.join(', '),
      approximate: !streetNumber,
    }
  }

  const fallback = result.formatted_address?.trim()
  if (!fallback) return null

  // Quitamos país/CP del formatted_address cuando sea posible.
  const cleaned = fallback
    .replace(/,\s*Argentina\s*$/i, '')
    .replace(/,\s*[A-Z]?\d{4}[A-Z]{0,3}\s*/gi, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/^,\s*|,\s*$/g, '')
    .trim()

  return {
    displayName: cleaned || fallback,
    approximate: !streetNumber,
  }
}

async function requestGoogleGeocode(
  params: URLSearchParams
): Promise<GoogleGeocodeResult | null> {
  if (!hasGoogleKey()) return null

  params.set('key', GOOGLE_API_KEY)
  params.set('language', 'es')
  if (COUNTRY_CODES) {
    // region sesga resultados; components filtra por país en forward.
    params.set('region', COUNTRY_CODES.split(',')[0]?.trim() || 'ar')
  }

  const response = await fetch(`${GOOGLE_GEOCODE_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`GOOGLE_GEOCODING_HTTP_${response.status}`)
  }

  const data = (await response.json()) as GoogleGeocodeResponse

  if (data.status === 'ZERO_RESULTS') return null
  if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED') {
    throw new Error(`GOOGLE_GEOCODING_${data.status}`)
  }
  if (data.status !== 'OK' || !data.results?.length) {
    if (data.status === 'INVALID_REQUEST') return null
    throw new Error(`GOOGLE_GEOCODING_${data.status}`)
  }

  return data.results[0] ?? null
}

async function requestGoogleForward(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({ address: query })
  if (COUNTRY_CODES) {
    params.set('components', `country:${COUNTRY_CODES.split(',')[0]?.trim().toUpperCase() || 'AR'}`)
  }

  const biasParts = DEFAULT_BIAS.split(',').map((value) => Number(value.trim()))
  if (biasParts.length === 2 && biasParts.every(Number.isFinite)) {
    const [lat, lng] = biasParts
    const delta = 0.35
    params.set(
      'bounds',
      `${lat - delta},${lng - delta}|${lat + delta},${lng + delta}`
    )
  }

  const first = await requestGoogleGeocode(params)
  if (!first?.geometry?.location) return null

  const lat = Number(first.geometry.location.lat)
  const lng = Number(first.geometry.location.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const formatted = formatGoogleDeliveryAddress(first)
  return {
    lat,
    lng,
    displayName: formatted?.displayName ?? first.formatted_address ?? query,
    approximate: formatted?.approximate ?? true,
    provider: 'google',
  }
}

async function requestGoogleReverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    // Prioriza direcciones con calle/número cuando existen.
    result_type: 'street_address|premise|subpremise|route',
  })

  let first = await requestGoogleGeocode(params)

  // Si el filtro estricto no dio resultados, reintentamos sin result_type.
  if (!first) {
    const fallbackParams = new URLSearchParams({ latlng: `${lat},${lng}` })
    first = await requestGoogleGeocode(fallbackParams)
  }

  if (!first) return null

  const formatted = formatGoogleDeliveryAddress(first)
  if (!formatted) return null

  return {
    lat,
    lng,
    displayName: formatted.displayName,
    approximate: formatted.approximate,
    provider: 'google',
  }
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

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
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

  return {
    lat,
    lng,
    displayName: first.display_name,
    approximate: true,
    provider: 'nominatim',
  }
}

/** Arma una dirección corta y útil para delivery (sin país ni CP). */
function formatNominatimDeliveryAddress(
  address: NominatimAddress | undefined,
  fallback?: string
): {
  displayName: string
  approximate: boolean
} | null {
  if (!address) {
    if (!fallback?.trim()) return null
    return { displayName: fallback.trim(), approximate: true }
  }

  const street = address.road || address.pedestrian || address.path || undefined
  const houseNumber = address.house_number?.trim()
  const streetLine = street
    ? houseNumber
      ? `${street} ${houseNumber}`
      : street
    : undefined

  const locality =
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    undefined

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    undefined

  const parts = [streetLine, locality, city].filter(
    (part): part is string => Boolean(part && part.trim())
  )

  if (parts.length === 0) {
    if (!fallback?.trim()) return null
    return { displayName: fallback.trim(), approximate: true }
  }

  return {
    displayName: parts.join(', '),
    approximate: !houseNumber,
  }
}

async function requestNominatimReverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18',
  })

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'es',
    },
  })

  if (!response.ok) {
    throw new Error(`GEOCODING_HTTP_${response.status}`)
  }

  const data = (await response.json()) as {
    display_name?: string
    address?: NominatimAddress
    error?: string
  }

  const formatted = formatNominatimDeliveryAddress(data.address, data.display_name)
  if (!formatted) return null

  return {
    lat,
    lng,
    displayName: formatted.displayName,
    approximate: formatted.approximate,
    provider: 'nominatim',
  }
}

async function runNominatim<T>(fn: () => Promise<T | null>): Promise<T | null> {
  const run = nominatimQueue.then(async () => {
    await throttleNominatim()
    return fn()
  })
  nominatimQueue = run.catch(() => undefined)
  return run
}

async function withNominatimFallback<T>(
  googleFn: () => Promise<T | null>,
  nominatimFn: () => Promise<T | null>
): Promise<T | null> {
  if (hasGoogleKey()) {
    try {
      const googleResult = await googleFn()
      if (googleResult) return googleResult
    } catch (error) {
      console.warn('[geocoding] Google falló, usando Nominatim:', error)
    }
  }

  return runNominatim(nominatimFn)
}

/**
 * Geocodifica una dirección a coordenadas.
 * Prioriza Google Maps si hay API key; si falla, usa Nominatim.
 */
export async function geocodeAddress(rawQuery: string): Promise<GeocodeResult | null> {
  const query = rawQuery.trim()
  if (query.length < 4) return null

  const key = normalizeKey(query)
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result
  }

  const result = await withNominatimFallback(
    () => requestGoogleForward(query),
    () => requestNominatim(query)
  )

  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS })
  return result
}

/**
 * Convierte coordenadas en una dirección legible (reverse geocoding).
 * Prioriza Google Maps si hay API key; si falla, usa Nominatim.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  const key = reverseCacheKey(lat, lng)
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result
  }

  const result = await withNominatimFallback(
    () => requestGoogleReverse(lat, lng),
    () => requestNominatimReverse(lat, lng)
  )

  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS })
  return result
}
