/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['dotready.co', 'dot-ready.vercel.app']
    }
  }
}
module.exports = nextConfig
