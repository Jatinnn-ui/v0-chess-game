/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optional same-origin proxy for local previews; production routing is unchanged.
  async rewrites() {
    const backend = process.env.CHESS_API_PROXY
    return backend ? [{ source: "/api/:path*", destination: `${backend}/:path*` }] : []
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
