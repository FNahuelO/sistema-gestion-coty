/**
 * Limitador de intentos en memoria para proteger el login contra fuerza bruta.
 *
 * Pensado para un despliegue de un solo proceso (self-hosted con `next start`).
 * En entornos multi-instancia conviene migrar a un store compartido (Redis).
 */

type Bucket = {
  failures: number[]
  blockedUntil: number
}

export type RateLimitOptions = {
  /** Cantidad de fallos permitidos dentro de la ventana antes de bloquear. */
  maxAttempts: number
  /** Ventana de tiempo en la que se cuentan los fallos. */
  windowMs: number
  /** Tiempo de bloqueo una vez superado el máximo de intentos. */
  blockMs: number
}

export type RateLimitStatus = {
  blocked: boolean
  retryAfterSeconds: number
  remainingAttempts: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
}

const buckets = new Map<string, Bucket>()

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    const hasActiveBlock = bucket.blockedUntil > now
    const hasRecentFailures = bucket.failures.some((timestamp) => now - timestamp < DEFAULT_OPTIONS.windowMs)
    if (!hasActiveBlock && !hasRecentFailures) {
      buckets.delete(key)
    }
  }
}

function getBucket(key: string): Bucket {
  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { failures: [], blockedUntil: 0 }
    buckets.set(key, bucket)
  }
  return bucket
}

/** Devuelve el estado actual sin registrar un intento. */
export function checkRateLimit(key: string, options: Partial<RateLimitOptions> = {}): RateLimitStatus {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket) {
    return { blocked: false, retryAfterSeconds: 0, remainingAttempts: config.maxAttempts }
  }

  if (bucket.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
      remainingAttempts: 0,
    }
  }

  const recentFailures = bucket.failures.filter((timestamp) => now - timestamp < config.windowMs)
  return {
    blocked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, config.maxAttempts - recentFailures.length),
  }
}

/** Registra un intento fallido y devuelve el nuevo estado (incluye bloqueo si corresponde). */
export function registerFailedAttempt(key: string, options: Partial<RateLimitOptions> = {}): RateLimitStatus {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const now = Date.now()
  const bucket = getBucket(key)

  bucket.failures = bucket.failures.filter((timestamp) => now - timestamp < config.windowMs)
  bucket.failures.push(now)

  if (bucket.failures.length >= config.maxAttempts) {
    bucket.blockedUntil = now + config.blockMs
    bucket.failures = []
    pruneExpired(now)
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(config.blockMs / 1000),
      remainingAttempts: 0,
    }
  }

  pruneExpired(now)
  return {
    blocked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, config.maxAttempts - bucket.failures.length),
  }
}

/** Limpia el contador tras un login exitoso. */
export function clearRateLimit(key: string) {
  buckets.delete(key)
}
