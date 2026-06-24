import { test, expect, type Page } from "@playwright/test";
import { enterPin, addChore } from "./_helpers";

function uniqueEmail() {
  return `sub.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Sub Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function addKid(page: Page, name: string, pin: string) {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Kids", exact: true }).click();
  await expect(page).toHaveURL(/\/manage\/kids$/);
  await page.getByLabel("Name").fill(name);
  await page.getByRole("radio", { name: "Cat", exact: true }).check();
  await page.getByLabel("4-digit PIN").fill(pin);
  await page.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

test("kid logs a chore, parent approves, points are added", async ({
  page,
}) => {
  const parentEmail = uniqueEmail();
  await signUp(page, parentEmail);
  await addChore(page, "Make bed");
  await addKid(page, "Kiddo", "4321");

  // Sign out; kid signs in via the picker.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /Kiddo/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);

  // Kid logs the chore.
  await page.getByRole("link", { name: /log a chore/i }).click();
  await expect(page).toHaveURL(/\/submit$/);
  await page.getByRole("button", { name: /make bed/i }).click();

  // Logging redirects to the kid's home, showing it as waiting.
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByText(/\+5 waiting for approval/i)).toBeVisible();

  // Parent signs back in and approves.
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(parentEmail);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(
    page.getByRole("heading", { name: /chore approvals/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /approve make bed for kiddo/i })
    .click();

  // Points land on the kid's balance.
  await expect(page.getByText("5 pts", { exact: true })).toBeVisible();
});
