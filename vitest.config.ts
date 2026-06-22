import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["lib/**/*.ts"],
      // Excluded: code requiring the Next.js server/runtime (covered by E2E).
      exclude: ["lib/db/**", "lib/auth/session.ts", "**/*.d.ts"],
      thresholds: {
        "lib/domain/**/*.ts": {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
