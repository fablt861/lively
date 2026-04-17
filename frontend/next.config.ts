import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.kinky.live',
      },
      {
        protocol: 'https',
        hostname: 'staging.api.kinky.live',
      },
      {
        protocol: 'https',
        hostname: 'livelyapp.vercel.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  // Trigger redeploy for matchmaking fixes
};

export default nextConfig;
