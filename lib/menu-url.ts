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
