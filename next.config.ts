import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["sharp"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
