import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { enterPin, addChore } from "./_helpers";

function uniqueEmail() {
  return `hype.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];
async function expectNoA11yViolations(page: Page, label: string) {
  // Let entrance animations (e.g. the points "pop") settle so axe doesn't
  // sample a mid-fade, translucent color and report a false contrast failure.
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

async function signUpParent(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Hype Family");
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

async function addReward(page: Page, name: string, cost: number) {
  await page.goto("/manage/rewards/new");
  const add = page.getByRole("region", { name: /add a reward/i });
  await add.getByLabel("Name").fill(name);
  await add.getByLabel(/cost/i).fill(String(cost));
  await add.getByRole("button", { name: /add reward/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

test("award screen groups by category, searches, and awards to several kids", async ({
  page,
}) => {
  await signUpParent(page);
  await addKid(page, "Robin");
  await addKid(page, "Sky");
  await addChore(page, "Brush teeth", { points: 3, category: "Self-care" });
  await addChore(page, "Walk dog", { points: 5, category: "Pets" });

  await page.goto("/dashboard");
  await page.getByRole("link", { name: /robin/i }).click();
  await expect(page).toHaveURL(/\/award\//);
  await expect(page).toHaveTitle(/\S/);

  // Category sections render.
  await expect(page.getByText("Self-care")).toBeVisible();
  await expect(page.getByText("Pets")).toBeVisible();
  await expectNoA11yViolations(page, "/award");

  // Search filters the list.
  await page.getByLabel("Search chores").fill("walk");
  await expect(page.getByRole("button", { name: /walk dog/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /brush teeth/i })).toHaveCount(
    0,
  );
  await page.getByLabel("Search chores").fill("");

  // Award "Walk dog" to Robin plus Sky (the "also give to" chip). The award is a
  // void action with no nav, so wait for Robin's header to reflect it before
  // leaving (otherwise we race the server revalidation).
  await page.getByRole("button", { name: /^sky$/i }).click();
  await page.getByRole("button", { name: /walk dog/i }).click();
  await expect(page.getByText("5 pts")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("5 pts")).toHaveCount(2);
});

test("kid dashboard shows redeem-now rewards and a savings goal", async ({
  page,
}) => {
  await signUpParent(page);
  await addKid(page, "Robin");
  await addChore(page, "Big job", { points: 30, category: "Around the home" });
  await addReward(page, "Ice cream", 10);

  // Give Robin enough to afford the reward.
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /robin/i }).click();
  await page.getByRole("button", { name: /big job/i }).click();
  await expect(page.getByText("30 pts")).toBeVisible();

  // Sign in as Robin.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /robin/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);

  // Redeem-now shelf, almost-there, streak and the goal picker are all on this
  // first clean render — axe here (before the goal form re-render).
  await expect(page.getByText(/you can get these now/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /ice cream/i })).toBeVisible();
  await expect(page.getByText(/streak/i)).toBeVisible();
  await expectNoA11yViolations(page, "/me");

  // Set a savings goal.
  await page.getByLabel(/pick a reward to save toward/i).selectOption({
    index: 0,
  });
  await page.getByRole("button", { name: /^set goal$/i }).click();
  await expect(page.getByRole("heading", { name: "My goal" })).toBeVisible();
});
