import type { NextConfig } from "next";

// TODO: [ARCHITECTURE] Remove ignoreBuildErrors after fixing TypeScript errors
// Run: npx tsc --noEmit > ts-errors.txt 2>&1 to identify all errors
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ⚠️ TEMPORARY: Must fix before production deployment
  },
  reactStrictMode: false, // TODO: [ARCHITECTURE] Enable for production to catch React 19 issues
  serverExternalPackages: ["sharp"],
  turbopack: {
    root: __dirname,
  },
  
  // Performance optimizations
  compress: true,
  
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Vary",
            value: "Accept-Encoding",
          },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  
  // Experimental features for performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    optimizeCss: true,
  },
};

export default nextConfig;
