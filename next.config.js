/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'smeutekoodlepyhboybc.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
