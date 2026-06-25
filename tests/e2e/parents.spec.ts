import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function uniqueEmail(p: string) {
  return `${p}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUpOwner(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Co Family");
  await page.getByLabel("Your name").fill("Alex");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function createInvite(page: Page): Promise<string> {
  await page.getByRole("link", { name: "Parents" }).click();
  await expect(page).toHaveURL(/\/manage\/parents$/);
  await page.getByRole("button", { name: /invite a parent/i }).click();
  const code = (
    await page
      .getByText(/^PRNT-/)
      .first()
      .textContent()
  )?.trim();
  expect(code).toMatch(/^PRNT-/);
  return code as string;
}

async function signOut(page: Page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function joinAs(page: Page, code: string, name: string, email: string) {
  await page.goto("/join");
  await page.getByLabel("Invite code").fill(code);
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /join family/i }).click();
}

test("a co-parent joins via an invite code and shares the dashboard", async ({
  page,
}) => {
  await signUpOwner(page, uniqueEmail("owner"));
  const code = await createInvite(page);

  // The manage screen is accessible.
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);

  await signOut(page);
  await joinAs(page, code, "Sam", uniqueEmail("co"));
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Sam" }),
  ).toBeVisible();

  // The co-parent sees both parents but cannot remove anyone (not the owner).
  await page.getByRole("link", { name: "Parents" }).click();
  await expect(page).toHaveURL(/\/manage\/parents$/);
  await expect(page.getByText("Alex", { exact: true })).toBeVisible();
  await expect(page.getByText("Sam", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^remove/i })).toHaveCount(0);
});

test("a used invite code can't be redeemed twice", async ({ page }) => {
  await signUpOwner(page, uniqueEmail("owner"));
  const code = await createInvite(page);
  await signOut(page);
  await joinAs(page, code, "Sam", uniqueEmail("co"));
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);

  await joinAs(page, code, "Jo", uniqueEmail("co2"));
  await expect(page.getByText(/invalid or has expired/i)).toBeVisible();
});

test("the owner can remove a co-parent", async ({ page }) => {
  const ownerEmail = uniqueEmail("owner");
  await signUpOwner(page, ownerEmail);
  const code = await createInvite(page);
  await signOut(page);
  await joinAs(page, code, "Sam", uniqueEmail("co"));
  await expect(page).toHaveURL(/\/dashboard$/);

  // Co-parent signs out; owner signs back in with email + password.
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("link", { name: "Parents" }).click();
  await expect(page).toHaveURL(/\/manage\/parents$/);
  await expect(page.getByText("Sam", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /remove sam/i }).click();
  await expect(page.getByText("Sam", { exact: true })).toHaveCount(0);
});
