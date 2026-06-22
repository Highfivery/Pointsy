import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Service worker is noisy in dev; enable only for production builds.
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);
