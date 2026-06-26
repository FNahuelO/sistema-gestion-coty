import os from 'node:os'

/** @type {import('next').NextConfig} */
function getLocalNetworkHosts() {
  const hosts = []

  for (const iface of Object.values(os.networkInterfaces())) {
    for (const address of iface ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        hosts.push(address.address)
      }
    }
  }

  return hosts
}

const allowedDevOrigins = Array.from(
  new Set(
    [
      process.env.TUNNEL_URL,
      process.env.NEXTAUTH_URL,
      process.env.ALLOWED_DEV_ORIGIN,
      ...(process.env.NODE_ENV === 'development' ? getLocalNetworkHosts() : []),
    ]
      .filter(Boolean)
      .flatMap((value) => {
        try {
          const host = new URL(value).hostname
          return [host, new URL(value).host]
        } catch {
          const normalized = value
            .replace(/^https?:\/\//, '')
            .replace(/\/.*$/, '')
          const hostname = normalized.split(':')[0]
          return [hostname, normalized].filter(Boolean)
        }
      })
      .filter(Boolean)
  )
)

const securityHeaders = [
  // Fuerza HTTPS en navegadores durante 2 años (incluye subdominios).
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Evita que el navegador "adivine" el tipo MIME (anti sniffing).
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Impide que la app se cargue dentro de un iframe (anti clickjacking).
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'",
  },
  // No filtrar la URL completa (con datos sensibles) a sitios externos.
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Desactiva APIs sensibles del navegador que la app no usa.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
]

const nextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
}

export default nextConfig
