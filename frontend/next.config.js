/** @type {import('next').NextConfig} */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'http://backend:8000'; // service name in docker-compose

if (!/^https?:\/\//.test(API_BASE)) {
  throw new Error(`NEXT_PUBLIC_API_BASE_URL must be absolute, got: ${API_BASE}`);
}

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;