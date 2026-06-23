export const MESA_QUERY_PARAM = 'mesa'

export function getAppBaseUrl(origin?: string) {
  if (origin) return origin.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
}

export function buildHomeUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, '')
  return `${normalized}/`
}

export function buildMenuUrl(baseUrl: string, options?: { tableId?: string }) {
  const url = new URL('/menu', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  if (options?.tableId) {
    url.searchParams.set(MESA_QUERY_PARAM, options.tableId)
  }
  return url.toString()
}

export function buildMenuPathWithTable(tableId: string) {
  return `/menu?${MESA_QUERY_PARAM}=${encodeURIComponent(tableId)}`
}

export function getMesaIdFromSearch(search: string | URLSearchParams) {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search
  return params.get(MESA_QUERY_PARAM)?.trim() || null
}

/** Ruta interna con parámetros opcionales (mesa, promo, etc.). */
export function buildCustomerPath(
  path: string,
  options?: { tableId?: string | null; params?: Record<string, string | undefined> }
) {
  const [pathname, existingSearch = ''] = path.split('?')
  const search = new URLSearchParams(existingSearch)

  if (options?.tableId) {
    search.set(MESA_QUERY_PARAM, options.tableId)
  }

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        search.set(key, value)
      }
    }
  }

  const query = search.toString()
  return query ? `${pathname}?${query}` : pathname
}
