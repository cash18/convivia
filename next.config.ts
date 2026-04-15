import type { NextConfig } from "next";

const baseSecurityHeaders: { key: string; value: string }[] = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverActions: {
      /** Consente allegati scontrino fino a ~20 MB (multipart + campi form). */
      bodySizeLimit: "32mb",
    },
  },
  headers: async () => {
    const headers = [...baseSecurityHeaders];
    if (process.env.VERCEL === "1") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
