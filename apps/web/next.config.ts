import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  images: {
    unoptimized: true,
  },

  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ??
      "https://bikashengineering.com.np/api-internal";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;