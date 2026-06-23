import { type Page } from "@playwright/test";

/** Tap a PIN into the on-screen number pad (auto-submits on the last digit). */
export async function enterPin(page: Page, pin: string) {
  for (const digit of pin) {
    await page.getByRole("button", { name: digit, exact: true }).click();
  }
}
