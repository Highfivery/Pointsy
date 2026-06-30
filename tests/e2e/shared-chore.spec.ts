import { test, expect, type Page } from "@playwright/test";
import { enterPin } from "./_helpers";

function uniqueEmail() {
  return `shared.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Shared Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function addKid(page: Page, name: string, pin: string) {
  await page.goto("/manage/kids/new");
  await page.getByLabel("Name").fill(name);
  await page.getByRole("radio", { name: "Cat", exact: true }).check();
  await page.getByLabel("4-digit PIN").fill(pin);
  await page.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function signInKid(page: Page, name: string, pin: string) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: new RegExp(name, "i") }).click();
  await enterPin(page, pin);
  await expect(page).toHaveURL(/\/me$/);
}

test("a shared chore is first come, first served across kids", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "Mobile Chrome",
    "One project is enough for this flow.",
  );

  await signUp(page, uniqueEmail());
  await addKid(page, "Ava", "1234");
  await addKid(page, "Bo", "5678");

  // A shared, one-per-day chore.
  await page.goto("/manage/chores/new");
  await page.getByLabel("Name").fill("Feed the dog");
  await page.getByLabel("Points").fill("5");
  await page.getByLabel(/how often/i).selectOption("day");
  await page.getByLabel(/times per day/i).fill("1");
  await page.getByRole("radio", { name: "Shared by everyone" }).check();
  await page.getByRole("button", { name: /save chore/i }).click();
  await page.waitForURL(/\/manage\/chores$/);
  // The card carries a distinct "Shared" chip and the plain frequency.
  await expect(page.getByText("Shared", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Once a day/i).first()).toBeVisible();

  // Ava claims it.
  await signInKid(page, "Ava", "1234");
  await page.getByRole("link", { name: "Chores", exact: true }).click();
  await expect(page).toHaveURL(/\/submit$/);
  await page.getByRole("button", { name: /feed the dog/i }).click();
  await expect(page).toHaveURL(/\/me$/);

  // Bo can no longer log it — sees who got it first, and it's not a button.
  await signInKid(page, "Bo", "5678");
  await page.getByRole("link", { name: "Chores", exact: true }).click();
  await expect(page).toHaveURL(/\/submit$/);
  await expect(page.getByText(/Ava got it first/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /feed the dog/i })).toHaveCount(
    0,
  );
});
