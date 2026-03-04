/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ADD THIS SECTION BELOW:
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // This tells the builder to ignore the 'canvas' error
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig