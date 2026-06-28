import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { enterPin } from "./_helpers";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];
async function expectNoA11yViolations(page: Page, label: string) {
  // Let entrance animations (the points "pop" celebration) settle so axe
  // doesn't sample a mid-fade, translucent color and flag a false contrast miss.
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

function uniqueEmail() {
  return `chalkid.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Challenge Kid Family");
  await page.getByLabel("Your name").fill("Pat");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function createChallenge(page: Page, title: string, target: string) {
  await page.goto("/manage/challenges/new");
  await page.getByLabel("Name").fill(title);
  await page.getByLabel("Points to earn").fill(target);
  await page.getByLabel(/bonus points/i).fill("10");
  await page.getByRole("button", { name: /save challenge/i }).click();
  await expect(page).toHaveURL(/\/manage\/challenges$/);
}

test("a kid sees challenge progress and an auto-paid bonus", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/manage/kids/new");
  const add = page.getByRole("region", { name: /add a child/i });
  await add.getByLabel("Name").fill("Robin");
  await add.getByLabel("4-digit PIN").fill("4321");
  await add.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Robin", { exact: true })).toBeVisible();

  // One challenge will sit in progress, one will complete on the same award.
  await createChallenge(page, "Sprint", "20");
  await createChallenge(page, "Quick Win", "10");

  // Award 12: Sprint → 12/20, Quick Win → done (+10 bonus → balance 22).
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage robin/i }).click();
  const custom = page.getByRole("region", { name: "Award or deduct points" });
  await custom.getByLabel("Points").fill("12");
  await custom.getByLabel("Reason").fill("Helping out");
  await custom.getByRole("button", { name: /^award points$/i }).click();
  await expect(page.getByText("22 pts")).toBeVisible(); // 12 + 10 bonus

  // Robin signs in → sees both states and the bonus reflected in the balance.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /robin/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);

  await expect(page.getByRole("heading", { name: "Challenges" })).toBeVisible();
  await expect(page.getByText("12 / 20 points")).toBeVisible();
  await expect(page.getByText(/bonus earned/i)).toBeVisible();
  await expectNoA11yViolations(page, "/me (challenges)");
});
