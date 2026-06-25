import { test, expect, type Page } from "@playwright/test";

function uniqueEmail() {
  return `team.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Team Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("a parent can mark a reward as a team reward, and it persists", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/manage/rewards/new");

  const add = page.getByRole("region", { name: /add a reward/i });
  await add.getByLabel("Name").fill("Movie night");
  await add.getByLabel("Cost (points)").fill("30");
  await add.getByLabel("Team reward").check();
  // Turning it on reveals the minimum-kids field + the solo option.
  await expect(add.getByLabel("Minimum kids")).toBeVisible();
  await add.getByLabel("Minimum kids").fill("3");
  await add.getByLabel("Also redeemable solo").check();
  await add.getByRole("button", { name: /add reward/i }).click();
  await expect(page.getByText("Movie night", { exact: true })).toBeVisible();

  // Re-open the card's edit form — the toggles and minimum stuck.
  await page.goto("/manage/rewards");
  const card = page.getByRole("region", { name: "Manage Movie night" });
  await card.getByTitle("Edit").click();
  await expect(card.getByLabel("Team reward")).toBeChecked();
  await expect(card.getByLabel("Minimum kids")).toHaveValue("3");
  await expect(card.getByLabel("Also redeemable solo")).toBeChecked();
});
