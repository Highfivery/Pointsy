import { test, expect, type Page } from "@playwright/test";
import { enterPin } from "./_helpers";

const PASSWORD = "supersecret123";
function uniqueEmail() {
  return `teamup.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function addKid(page: Page, name: string, pin: string) {
  await page.goto("/manage/kids");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill(name);
  await add.getByLabel("4-digit PIN").fill(pin);
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function awardCustom(page: Page, kidName: string, points: string) {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: new RegExp(kidName, "i") }).click();
  const custom = page.locator("details", {
    has: page.getByText("Award custom points"),
  });
  await page.getByText("Award custom points").click();
  await custom.getByLabel("Points").fill(points);
  await custom.getByLabel("Reason").fill("seed");
  await custom.getByRole("button", { name: /^award points$/i }).click();
  await expect(page.getByText(`${points} pts`)).toBeVisible();
}

async function kidSignIn(page: Page, name: string, pin: string) {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(name, "i") }).click();
  await enterPin(page, pin);
  await expect(page).toHaveURL(/\/me$/);
}

async function signOutKid(page: Page) {
  await page.goto("/me");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("kids team up for a reward and a parent approves the split", async ({
  page,
}) => {
  // Parent setup.
  const email = uniqueEmail();
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Team Up Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await addKid(page, "Ava", "1111");
  await addKid(page, "Bo", "2222");

  await page.goto("/manage/rewards");
  const add = page.getByRole("region", { name: /add a reward/i });
  await add.getByLabel("Name").fill("Movie night");
  await add.getByLabel("Cost (points)").fill("30");
  await add.getByLabel("Team reward").check();
  await add.getByLabel("Minimum kids").fill("2");
  await add.getByRole("button", { name: /add reward/i }).click();
  await expect(page.getByText("Movie night", { exact: true })).toBeVisible();

  await awardCustom(page, "Ava", "20");
  await awardCustom(page, "Bo", "20");

  // Ava proposes the team-up and invites Bo.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await kidSignIn(page, "Ava", "1111");
  await page.goto("/redeem");
  await page.getByRole("button", { name: /team up/i }).click();
  await expect(page.getByText(/team up for movie night/i)).toBeVisible();
  await page.getByRole("checkbox", { name: "Bo" }).check();
  await expect(page.getByText(/your share is 15 points/i)).toBeVisible();
  await page.getByRole("button", { name: /send team-up invites/i }).click();
  await expect(page.getByText(/waiting for teammates/i)).toBeVisible();

  // Bo accepts the invite.
  await signOutKid(page);
  await kidSignIn(page, "Bo", "2222");
  await page.goto("/redeem");
  await expect(page.getByText(/wants to team up/i)).toBeVisible();
  await expect(page.getByText(/your share: 15 points/i)).toBeVisible();
  await page.getByRole("button", { name: /i.?m in/i }).click();
  await expect(page.getByText(/waiting for a grown-up/i)).toBeVisible();

  // Parent approves; each kid pays their 15-point share.
  await signOutKid(page);
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: /team-up approvals/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /approve movie night team-up/i })
    .click();
  await expect(page.getByText(/team-up approvals/i)).toHaveCount(0);

  // Ava's balance dropped to 5 (20 − 15).
  await page.getByRole("button", { name: /sign out/i }).click();
  await kidSignIn(page, "Ava", "1111");
  await expect(page.getByText("5", { exact: true })).toBeVisible();
});
