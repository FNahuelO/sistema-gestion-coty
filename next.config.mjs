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
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
}

export default nextConfig
