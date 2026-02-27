import type { NextConfig } from "next";

const apiBaseUrl =
  process.env.API_INTERNAL_URL ??
  "http://api:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/renders",
        destination: `${apiBaseUrl}/renders`,
      },
      {
        source: "/renders/:path*",
        destination: `${apiBaseUrl}/renders/:path*`,
      },
      {
        source: "/assets/upload",
        destination: `${apiBaseUrl}/assets/upload`,
      },
      {
        source: "/assets/:path*",
        destination: `${apiBaseUrl}/assets/:path*`,
      },
    ];
  },
};

export default nextConfig;
