import { test, expect, type Page } from "@playwright/test";
import { enterPin } from "./_helpers";
import AxeBuilder from "@axe-core/playwright";

function uniqueEmail() {
  return `home.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Picker Family");
  await page.getByLabel("Your name").fill("Robin");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByLabel(/parent or guardian/i).check();
  await page.getByRole("button", { name: /create family/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("a LOGGED-IN parent at / sees the picker, never marketing", async ({
  page,
}) => {
  await signUp(page); // now signed in (session set)
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /who.?s signing in/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create your family/i }),
  ).toHaveCount(0);
});

test("a logged-in user whose device has NO family cookie still sees the picker", async ({
  page,
  context,
}) => {
  await signUp(page);
  // Simulate a session created before the device cookie existed (the prod bug).
  await context.clearCookies({ name: "pointsy_family" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /who.?s signing in/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create your family/i }),
  ).toHaveCount(0);
});

test("a kid cannot open the parent dashboard by URL", async ({ page }) => {
  await signUp(page);

  // Add a kid.
  await page.goto("/manage/kids/new");
  await page.getByLabel("Name").fill("Kiddo");
  await page.getByRole("radio", { name: "Cat", exact: true }).check();
  await page.getByLabel("4-digit PIN").fill("4321");
  await page.getByRole("button", { name: /add child/i }).click();
  await expect(page.getByText("Kiddo")).toBeVisible();

  // Sign out, sign in as the kid.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: /Kiddo/i }).click();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/me$/);

  // The kid types the parent dashboard URL → bounced to their own home.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByRole("heading", { name: /Hi Kiddo/i })).toBeVisible();
});

test("a brand-new device sees the marketing home with clear ways in", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /points that make chores fun/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create your family/i }),
  ).toBeVisible();
  // Family code and co-parent invite are distinct, correctly-routed entries.
  await expect(
    page.getByRole("link", { name: /kids & family/i }),
  ).toHaveAttribute("href", "/enter");
  await expect(
    page.getByRole("link", { name: /invited as a co-parent/i }),
  ).toHaveAttribute("href", "/join");
});

test("the family-code step has matching copy (no 'tap your name')", async ({
  page,
}) => {
  await page.goto("/enter");
  await expect(
    page.getByRole("heading", { name: /find your family/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Family code")).toBeVisible();
  await expect(page.getByText(/tap your name/i)).toHaveCount(0);
  // Co-parents who land here have an escape hatch to the invite flow.
  await expect(
    page.getByRole("link", { name: /invited as a co-parent/i }),
  ).toBeVisible();
});

test("a known device shows the PIN-gated profile picker at / — never marketing", async ({
  page,
}) => {
  await signUp(page); // associates this device with the family (cookie)

  // Give the parent a PIN so they appear in the picker.
  await page.getByText(/set a sign-in pin for yourself/i).click();
  await page.getByLabel(/4-digit PIN/i).fill("4321");
  await page.getByRole("button", { name: /^set pin$/i }).click();
  await expect(page.getByText("PIN saved.")).toBeVisible();
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);

  // Home is the picker — not marketing, not a password form.
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /who.?s signing in/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Robin/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create your family/i }),
  ).toHaveCount(0);

  // No WCAG violations on the picker home.
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);

  // A PIN is required to reach a dashboard.
  await page.getByRole("button", { name: /Robin/i }).click();
  await expect(page.getByText("Enter your PIN")).toBeVisible();
  await enterPin(page, "4321");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("the picker offers a parent email + password fallback", async ({
  page,
}) => {
  await signUp(page); // parent has no PIN yet
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /sign in with email/i }).first(),
  ).toBeVisible();
});
