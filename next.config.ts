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
  // Never reload when the network comes back. A Wi-Fi-only family tablet drops
  // Wi-Fi while asleep; when a kid woke it and tapped their name, the
  // reconnect fired "online" and the reload threw them from the PIN pad back
  // to the profile picker. Pages are network-only anyway (see app/sw.ts), so a
  // reload adds nothing — the next action simply goes to the network.
  reloadOnOnline: false,
});

export default withSerwist(nextConfig);
