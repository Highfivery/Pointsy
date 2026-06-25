import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag2aaa"];
async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

function uniqueEmail() {
  return `chal.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Challenge Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("a parent creates a challenge and sees it in the list", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/manage/kids");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill("Robin");
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Robin", { exact: true })).toBeVisible();

  // Reach Challenges from the dashboard.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Challenges", exact: true }).click();
  await expect(page).toHaveURL(/\/manage\/challenges$/);
  await expect(
    page.getByRole("heading", { name: "Challenges", level: 1 }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/challenges/i); // settle soft-nav title
  await expectNoA11yViolations(page, "/manage/challenges (empty)");

  // Create a points challenge (dates come pre-filled).
  await page.getByRole("link", { name: /add a challenge/i }).click();
  await expect(page).toHaveURL(/\/manage\/challenges\/new$/);
  await page.getByLabel("Name").fill("Super Saver Week");
  await page.getByLabel("Points to earn").fill("100");
  await page.getByLabel(/bonus points/i).fill("20");
  await expect(page).toHaveTitle(/new challenge/i);
  await expectNoA11yViolations(page, "/manage/challenges/new");

  await page.getByRole("button", { name: /save challenge/i }).click();
  await expect(page).toHaveURL(/\/manage\/challenges$/);
  await expect(page.getByText("Super Saver Week")).toBeVisible();
  await expect(page.getByText(/Earn 100 points/)).toBeVisible();
  await expect(page.getByText("+20")).toBeVisible();
  await expect(page).toHaveTitle(/challenges/i); // settle soft-nav title
  await expectNoA11yViolations(page, "/manage/challenges (one)");

  // A recurring weekly challenge shows a "Weekly" tag in the list meta.
  await page.getByRole("link", { name: /add a challenge/i }).click();
  await page.getByLabel("Name").fill("Weekly Win");
  await page.getByRole("radio", { name: "Every week" }).check();
  await page.getByLabel("Points to earn").fill("30");
  await page.getByLabel(/bonus points/i).fill("10");
  await page.getByRole("button", { name: /save challenge/i }).click();
  await expect(page).toHaveURL(/\/manage\/challenges$/);
  await expect(page.getByText(/Earn 30 points.*Weekly/)).toBeVisible();
});
