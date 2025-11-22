/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {},
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtxhcjloistkmsusfzcg.supabase.co',
        port: '',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
