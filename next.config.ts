import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Serwist injects a webpack config (used by `next build --webpack`). Declaring
  // an empty Turbopack config tells `next dev` (Turbopack) the coexistence is
  // intentional, avoiding the "webpack config with no turbopack config" error.
  turbopack: {},
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Service worker is noisy in dev; enable only for production builds.
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);
