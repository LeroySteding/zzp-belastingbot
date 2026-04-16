import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, punycode: false }
    return config
  },
}

export default nextConfig
