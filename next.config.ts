import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "tyora.io"
          }
        ],
        destination: "https://www.tyora.io/:path*",
        permanent: true
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        ]
      },
      {
        source: "/me/custom/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0"
          },
          {
            key: "Pragma",
            value: "no-cache"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
