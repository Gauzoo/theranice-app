import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Supprime le warning middleware (temporaire jusqu'à migration)
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
