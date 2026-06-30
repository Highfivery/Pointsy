import { test, expect, type Page } from "@playwright/test";

function uniqueEmail() {
  return `acct.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("The Marshalls");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function addKid(page: Page, name: string) {
  await page.goto("/manage/kids/new");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill(name);
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

test("a parent permanently deletes a child (type-to-confirm)", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "Mobile Chrome",
    "One project is enough for this flow.",
  );

  await signUp(page);
  await addKid(page, "Robin");

  await page.goto("/manage/kids");
  await page.locator('summary[aria-label="Delete Robin permanently"]').click();

  // Button stays disabled until the name matches exactly.
  const del = page.getByRole("button", { name: /delete permanently/i });
  await expect(del).toBeDisabled();
  await page.locator('input[name="confirm"]').fill("Robin");
  await expect(del).toBeEnabled();
  await del.click();

  await expect(page).toHaveURL(/\/manage\/kids$/);
  await expect(page.getByText("Robin", { exact: true })).toHaveCount(0);
});

test("a parent can export their family data as JSON without secrets", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "Mobile Chrome",
    "One project is enough for this check.",
  );

  await signUp(page);
  const res = await page.request.get("/api/family/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain("attachment");
  const body = await res.text();
  expect(body).toContain('"schema": "pointsy.family-export.v1"');
  expect(body).not.toMatch(/passwordHash|pinHash|password_hash|pin_hash/);
});
