import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { enterPin } from "./_helpers";

function uniqueEmail() {
  return `win.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

const SCREENS = "test-results/logging-window";

async function signUp(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Family name").fill("Window Family");
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

async function startNewChore(page: Page, name: string, points = 5) {
  await page.goto("/manage/chores/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Points").fill(String(points));
}

test.describe("chore logging windows", () => {
  test("parent sets a window, it round-trips, and the kid sees it gated", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "Mobile Safari" &&
        testInfo.project.name !== "Mobile Chrome" &&
        testInfo.project.name !== "Desktop Chrome",
      "Run once per browser project is enough.",
    );

    await signUp(page, uniqueEmail());
    await addKid(page, "Robin", "4321");

    // Tomorrow's weekday — used to build a chore that's locked *today*.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const allDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    // 1) A "between" time window — open all day for the screenshot/preview.
    await startNewChore(page, "Morning stretch", 4);
    await page.getByLabel("Time of day").selectOption("between");
    await page.getByLabel("Opens at").fill("00:00");
    await page.getByLabel("Closes at").fill("23:59");
    await expect(page.getByText(/Kids can log this/i)).toBeVisible();
    await page.screenshot({
      path: `${SCREENS}-editor-${testInfo.project.name}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: /save chore/i }).click();
    await page.waitForURL(/\/manage\/chores$/);

    // 2) A day-locked chore: only tomorrow's weekday → locked today.
    await startNewChore(page, "Take out trash", 10);
    for (const day of allDays) {
      if (day !== tomorrowDay) {
        // The checkbox is visually hidden behind its chip label, so force it.
        await page
          .getByRole("checkbox", { name: day })
          .uncheck({ force: true });
      }
    }
    await page.getByRole("button", { name: /save chore/i }).click();
    await page.waitForURL(/\/manage\/chores$/);

    // The catalog card summarises the window with a clock chip (single day →
    // its 3-letter abbreviation).
    await expect(
      page.getByText(tomorrowDay.slice(0, 3), { exact: false }).first(),
    ).toBeVisible();

    // Round-trip: reopen the day-locked chore; only tomorrow stays checked.
    await page
      .getByRole("link", { name: /take out trash/i })
      .first()
      .click();
    await page.waitForURL(/\/manage\/chores\/[0-9a-f-]+$/);
    await expect(
      page.getByRole("checkbox", { name: tomorrowDay }),
    ).toBeChecked();
    const otherDay = allDays.find((d) => d !== tomorrowDay)!;
    await expect(
      page.getByRole("checkbox", { name: otherDay }),
    ).not.toBeChecked();

    // The kid signs in and sees both states on /submit.
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: /Robin/i }).click();
    await enterPin(page, "4321");
    await expect(page).toHaveURL(/\/me$/);

    await page.getByRole("link", { name: "Chores", exact: true }).click();
    await expect(page).toHaveURL(/\/submit$/);

    // The open windowed chore is loggable.
    await expect(
      page.getByRole("button", { name: /morning stretch/i }),
    ).toBeVisible();
    // The day-locked chore shows when it opens + a live countdown, not a button.
    await expect(page.getByText(/Take out trash/i)).toBeVisible();
    await expect(page.getByText(/^Opens /).first()).toBeVisible();
    await expect(page.getByText(/Unlocks in/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /take out trash/i }),
    ).toHaveCount(0);

    await page.screenshot({
      path: `${SCREENS}-kid-${testInfo.project.name}.png`,
      fullPage: true,
    });

    // Accessibility on the kid's chores screen with the new states present.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
