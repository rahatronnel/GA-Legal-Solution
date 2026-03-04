/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // This is the strongest way to tell Vercel to ignore 'canvas'
    config.externals.push({ canvas: 'canvas' });
    return config;
  },
}

module.exports = nextConfig