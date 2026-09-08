import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Largest in-action friendly limit is the support-video upload (200MB);
  // every action below that enforces its own size+magic-byte validation, so
  // the framework limit must sit above the largest cap, never below it.
  experimental: { serverActions: { bodySizeLimit: "200mb" } },
};

export default nextConfig;
