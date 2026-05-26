import type { NextConfig } from "next";
import os from "node:os";

const isDevelopment = process.env.NODE_ENV !== "production";

const networkIpList = Object.values(os.networkInterfaces())
  .flatMap((entryList) => entryList ?? [])
  .filter(
    (entry): entry is os.NetworkInterfaceInfoIPv4 =>
    Boolean(entry && entry.address && entry.family === "IPv4" && !entry.internal)
  )
  .map((entry) => entry.address);

const explicitOrigins = (process.env.NEXT_PUBLIC_DEV_ORIGINS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const allowedDevOrigins = [...new Set(["127.0.0.1", "localhost", ...networkIpList, ...explicitOrigins])];

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://connect.squareup.com https://api.squareup.com https://*.squarecdn.com",
  "frame-src 'self' https://*.squarecdn.com https://squareup.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isDevelopment ? "" : "upgrade-insecure-requests"
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)"
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  ...(isDevelopment
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload"
        }
      ])
];

const noStoreHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, max-age=0"
  }
];

const nextConfig: NextConfig = {
  ...(isDevelopment ? { allowedDevOrigins } : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      },
      {
        source: "/owner/:path*",
        headers: noStoreHeaders
      },
      {
        source: "/api/owner/:path*",
        headers: noStoreHeaders
      },
      {
        source: "/checkout",
        headers: noStoreHeaders
      },
      {
        source: "/book/confirmation",
        headers: noStoreHeaders
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
