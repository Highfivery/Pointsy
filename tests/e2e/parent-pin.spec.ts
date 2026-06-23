import { test, expect, type Page } from "@playwright/test";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUpParent(page: Page): Promise<string> {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("PIN Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const code = (
    await page
      .getByText(/^[A-Z0-9]+-[A-Z0-9]+$/)
      .first()
      .textContent()
  )?.trim();
  return code ?? "";
}

test("a parent sets a PIN and signs in via the profile picker", async ({
  page,
}) => {
  const code = await signUpParent(page);

  // Set a quick sign-in PIN from the dashboard.
  await page.getByText(/set a sign-in pin for yourself/i).click();
  await page.getByLabel(/4-digit PIN/i).fill("1122");
  await page.getByRole("button", { name: /^set pin$/i }).click();
  await expect(page.getByText("PIN saved.")).toBeVisible();

  // Sign out.
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);

  // Sign back in through the picker.
  await page.goto("/enter");
  await page.getByLabel("Family code").fill(code);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /Pat/i }).click();
  await page.getByLabel(/enter your pin/i).fill("1122");
  await page.getByRole("button", { name: /let.?s go/i }).click();

  // A parent lands on the dashboard.
  await expect(page).toHaveURL(/\/dashboard$/);
});
