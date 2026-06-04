/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['cdlwatch.co', 'cdlwatch.vercel.app']
    }
  }
}
module.exports = nextConfig
