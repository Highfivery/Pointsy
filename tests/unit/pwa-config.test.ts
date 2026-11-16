import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Regression guard for the tablet PIN bounce. Serwist's `reloadOnOnline`
 * reloads the page on every "online" event. A Wi-Fi-only tablet reconnects
 * right as a kid taps their name, which threw them back to the profile picker.
 * The dev server disables the service worker, so E2E can't catch this.
 */
describe("PWA config", () => {
  it("never reloads the page when the network comes back", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toMatch(/reloadOnOnline:\s*false/);
    expect(config).not.toMatch(/reloadOnOnline:\s*true/);
  });
});
