import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: process.cwd()
  }
};

initOpenNextCloudflareForDev();

export default nextConfig;
