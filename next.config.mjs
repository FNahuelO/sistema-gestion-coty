/** @type {import('next').NextConfig} */
const allowedDevOrigins = Array.from(
  new Set(
    [process.env.TUNNEL_URL, process.env.NEXTAUTH_URL]
      .filter(Boolean)
      .map((value) => {
        try {
          return new URL(value).host
        } catch {
          return value
            .replace(/^https?:\/\//, '')
            .replace(/\/.*$/, '')
        }
      })
      .filter(Boolean)
  )
)

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
}

export default nextConfig
