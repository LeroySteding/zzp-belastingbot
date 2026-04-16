import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Silence warnings about punycode module
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, punycode: false }
    return config
  },
}

export default nextConfig
