export function buildInstagramUrl(handle?: string) {
  if (!handle?.trim()) return null
  const value = handle.trim()
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const username = value.replace(/^@/, '')
  return `https://instagram.com/${username}`
}

export function buildFacebookUrl(handle?: string) {
  if (!handle?.trim()) return null
  const value = handle.trim()
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const username = value.replace(/^@/, '')
  return `https://facebook.com/${username}`
}
