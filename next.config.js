/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Ignore node-specific modules in client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'pino-pretty': false,
        'fs': false,
        'net': false,
        'tls': false,
        'encoding': false,
        'usb': false,
      }
    }

    // Suppress warnings for optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/pino/ },
      { module: /node_modules\/@walletconnect/ },
      { module: /node_modules\/usb/ },
    ]

    // Ignore usb module completely (not needed for cloud deployment)
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push('usb')
    }

    return config
  },
}

module.exports = nextConfig

