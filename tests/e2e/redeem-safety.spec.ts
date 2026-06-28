import { test, expect, type Page } from "@playwright/test";
import { enterPin } from "./_helpers";

function uniqueEmail() {
  return `safety.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Safety Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("a reward request asks for confirmation (no accidental redeem)", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/manage/kids/new");
  let add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill("Robin");
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Robin", { exact: true })).toBeVisible();

  await page.goto("/manage/rewards/new");
  add = page.getByRole("region", { name: /add a reward/i });
  await add.getByLabel("Name").fill("Ice cream");
  await add.getByLabel(/cost/i).fill("5");
  await add.getByRole("button", { name: /add reward/i }).click();
  await expect(page.getByText("Ice cream", { exact: true })).toBeVisible();

  // Give Robin enough.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage robin/i }).click();
  const custom = page.getByRole("region", { name: "Award or deduct points" });
  await custom.getByLabel("Points").fill("20");
  await custom.getByLabel("Reason").fill("Allowance");
  await custom.getByRole("button", { name: /^award points$/i }).click();
  await expect(page.getByText("20 pts")).toBeVisible();

  // Sign in as Robin and open Rewards.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /robin/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);
  await page.goto("/redeem");

  // Tapping a reward opens the confirm sheet — it does NOT redeem yet.
  await page.getByRole("button", { name: /ice cream/i }).click();
  await expect(page.getByText(/request ice cream\?/i)).toBeVisible();
  await page.getByRole("button", { name: /not yet/i }).click();
  await expect(page.getByText(/request ice cream\?/i)).toBeHidden(); // sheet gone
  await expect(page.getByText(/pending/i)).toHaveCount(0);

  // Confirm this time.
  await page.getByRole("button", { name: /ice cream/i }).click();
  await page.getByRole("button", { name: /yes, request it/i }).click();
  await expect(page.getByText(/pending/i)).toBeVisible();
});

test("a kid in the red can't redeem and sees a clear message", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/manage/kids/new");
  let add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill("Robin");
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Robin", { exact: true })).toBeVisible();

  await page.goto("/manage/rewards/new");
  add = page.getByRole("region", { name: /add a reward/i });
  await add.getByLabel("Name").fill("Treat");
  await add.getByLabel(/cost/i).fill("5");
  await add.getByRole("button", { name: /add reward/i }).click();
  await expect(page.getByText("Treat", { exact: true })).toBeVisible();

  // Push Robin below zero.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage robin/i }).click();
  const adjust = page.getByRole("region", { name: "Award or deduct points" });
  await adjust.getByRole("button", { name: /^deduct$/i }).click();
  await adjust.getByLabel("Points").fill("10");
  await adjust.getByLabel("Reason").fill("Penalty");
  await adjust.getByRole("button", { name: /^deduct points$/i }).click();
  await expect(page.getByText("-10 pts")).toBeVisible();

  // Robin opens Rewards → clear "back to zero" message, nothing redeemable.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /robin/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);
  await page.goto("/redeem");
  await expect(page.getByText(/back to zero/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /treat/i })).toHaveCount(0);
});
