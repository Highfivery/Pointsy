import { test, expect, type Page } from "@playwright/test";
import { enterPin } from "./_helpers";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUpParent(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Reward Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function addKid(page: Page, name: string, pin: string) {
  await page.goto("/manage/kids/new");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill(name);
  await add.getByLabel("4-digit PIN").fill(pin);
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name)).toBeVisible();
}

async function signOutFrom(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function kidSignIn(page: Page, name: string, pin: string) {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(name, "i") }).click();
  await enterPin(page, pin);
  await expect(page).toHaveURL(/\/me$/);
}

test("a parent sets a kid-specific reward; only that kid sees the motivator", async ({
  page,
}) => {
  await signUpParent(page);
  await addKid(page, "Robin", "4321");
  await addKid(page, "Sam", "1122");

  // Create a reward just for Robin.
  await page.goto("/manage/rewards/new");
  await page.getByLabel("Name").fill("Movie night");
  await page.getByLabel(/cost/i).fill("10");
  await page
    .getByLabel(/who.s it for/i)
    .selectOption({ label: "Just for Robin" });
  await page.getByRole("button", { name: /add reward/i }).click();
  await expect(page).toHaveURL(/\/manage\/rewards$/);

  // Give Robin enough points to make it claimable.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage robin/i }).click();
  const panel = page.getByRole("region", { name: "Award or deduct points" });
  await panel.getByLabel("Points").fill("12");
  await panel.getByLabel("Reason").fill("Allowance");
  await panel.getByRole("button", { name: /^award points$/i }).click();
  await expect(page.getByText("12 pts")).toBeVisible();

  // Robin sees the "Just for you" motivator for the reward.
  await signOutFrom(page, "/dashboard");
  await kidSignIn(page, "Robin", "4321");
  await expect(
    page.getByRole("heading", { name: /just for you/i }),
  ).toBeVisible();
  await expect(page.getByText("Movie night", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/saved enough|to go|keep it up|halfway|great start/i),
  ).toBeVisible();

  // Sam does not see Robin's reward anywhere.
  await signOutFrom(page, "/me");
  await kidSignIn(page, "Sam", "1122");
  await expect(
    page.getByRole("heading", { name: /just for you/i }),
  ).toHaveCount(0);
  await expect(page.getByText("Movie night", { exact: true })).toHaveCount(0);
});

test("claiming a reward shows it as pending, doesn't collapse the goal, and can't be re-claimed", async ({
  page,
}) => {
  await signUpParent(page);
  await addKid(page, "Robin", "4321");

  // A reward just for Robin, and exactly enough points to claim it.
  await page.goto("/manage/rewards/new");
  await page.getByLabel("Name").fill("Movie night");
  await page.getByLabel(/cost/i).fill("10");
  await page
    .getByLabel(/who.s it for/i)
    .selectOption({ label: "Just for Robin" });
  await page.getByRole("button", { name: /add reward/i }).click();
  await expect(page).toHaveURL(/\/manage\/rewards$/);

  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage robin/i }).click();
  const panel = page.getByRole("region", { name: "Award or deduct points" });
  await panel.getByLabel("Points").fill("10");
  await panel.getByLabel("Reason").fill("Allowance");
  await panel.getByRole("button", { name: /^award points$/i }).click();
  await expect(page.getByText("10 pts")).toBeVisible();

  await signOutFrom(page, "/dashboard");
  await kidSignIn(page, "Robin", "4321");

  // Claim the reward from the "Just for you" card.
  await page.getByRole("button", { name: /claim it/i }).click();
  await page.getByRole("button", { name: /yes, request it/i }).click();

  // The goal card must NOT collapse — it stays at 10/10 and flips to pending.
  await expect(page.getByText(/waiting for a grown-up/i).first()).toBeVisible();
  await expect(page.getByText("10 / 10 pts")).toBeVisible();
  // The balance still reads 10 (nothing deducted) with the hold explained.
  await expect(page.getByText("0 to spend · 10 on hold")).toBeVisible();
  // A dedicated pending section lists the request with a way to cancel it.
  await expect(
    page.getByRole("heading", { name: /waiting for a grown-up/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /cancel movie night/i }),
  ).toBeVisible();

  await page.screenshot({
    path: "test-results/me-reward-pending.png",
    fullPage: true,
  });

  // It can't be claimed again — no claim button remains.
  await expect(page.getByRole("button", { name: /claim it/i })).toHaveCount(0);

  // Cancelling releases the hold and restores the claimable state.
  await page.getByRole("button", { name: /cancel movie night/i }).click();
  await expect(page.getByRole("button", { name: /claim it/i })).toBeVisible();
  await expect(page.getByText("0 to spend · 10 on hold")).toHaveCount(0);
});
