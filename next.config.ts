import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress assets using Gzip and Brotli
  compress: true,
  // Remove X-Powered-By header to reduce header payload and enhance security
  poweredByHeader: false,
  // Tree-shake large client libraries to optimize bundle size and hydration speed
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@xyflow/react",
      "framer-motion",
      "clsx",
      "tailwind-merge",
    ],
  },
};

export default nextConfig;

