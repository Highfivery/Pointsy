import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { enterPin, addChore } from "./_helpers";

function uniqueEmail() {
  return `putback.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];
async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

async function signUpParent(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("PutBack Family");
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

test("parent puts back an awarded chore from the activity feed", async ({
  page,
}) => {
  await signUpParent(page, uniqueEmail());
  await addKid(page, "Kiddo", "4321");
  await addChore(page, "Made bed", { points: 5 });

  await page.goto("/dashboard");
  await page.getByRole("link", { name: /manage kiddo/i }).click();
  await expect(page).toHaveURL(/\/award\//);
  await page.getByRole("button", { name: /made bed/i }).click();
  await expect(page.getByText("5 pts")).toBeVisible();

  // The earn shows in Recent activity with a put-back control; a confirm
  // sheet guards against stray taps.
  await page
    .getByRole("button", { name: /put back made bed for kiddo/i })
    .click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText(/put back made bed\?/i)).toBeVisible();
  await sheet.getByRole("button", { name: /put it back/i }).click();

  // Points come back off and the entry reads as put back (not deleted).
  await expect(page.getByText("0 pts")).toBeVisible();
  await expect(page.getByText(/put back ·/i)).toBeVisible();
  // One-shot: the control is gone for that entry.
  await expect(
    page.getByRole("button", { name: /put back made bed for kiddo/i }),
  ).toHaveCount(0);

  await expectNoA11yViolations(page, "/award with a put-back entry");
});

test("a put-back chore reads as not complete for the kid until approved again", async ({
  page,
}) => {
  const parentEmail = uniqueEmail();
  await signUpParent(page, parentEmail);
  await addKid(page, "Kiddo", "4321");
  await addChore(page, "Make bed");

  // Kid logs the chore.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /Kiddo/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);
  await page.getByRole("link", { name: "Chores", exact: true }).click();
  await page.getByRole("button", { name: /make bed/i }).click();
  await expect(page).toHaveURL(/\/me$/);

  // Parent approves, then puts it back from the kid's activity feed.
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(parentEmail);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .getByRole("button", { name: /approve make bed for kiddo/i })
    .click();
  await expect(page.getByText("5 pts", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: /manage kiddo/i }).click();
  await expect(page).toHaveURL(/\/award\//);
  await page
    .getByRole("button", { name: /put back make bed for kiddo/i })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /put it back/i })
    .click();
  await expect(page.getByText("0 pts")).toBeVisible();

  // Kid signs back in: the entry reads as put back, and the chore is
  // loggable again — completing it re-enters the normal approval flow.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /Kiddo/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByText(/put back ·/i)).toBeVisible();
  await expectNoA11yViolations(page, "/me with a put-back entry");

  await page.getByRole("link", { name: "Chores", exact: true }).click();
  await page.getByRole("button", { name: /make bed/i }).click();
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByText(/\+5 waiting for approval/i)).toBeVisible();
});
