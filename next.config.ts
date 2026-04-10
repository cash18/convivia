import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /** Consente allegati scontrino fino a ~20 MB (multipart + campi form). */
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
