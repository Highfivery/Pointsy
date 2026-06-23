import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function uniqueEmail() {
  return `parent.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

test.describe("parent auth", () => {
  test("sign up → dashboard → sign out → sign in", async ({ page }) => {
    const email = uniqueEmail();
    const password = "supersecret123";

    await page.goto("/sign-up");
    await page.getByLabel("Family name").fill("The Test Family");
    await page.getByLabel("Your name").fill("Pat Parent");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByLabel(/parent or guardian/i).check();
    await page.getByRole("button", { name: /create family/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Pat Parent" }),
    ).toBeVisible();
    await expect(page.getByText("The Test Family")).toBeVisible();

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("rejects a wrong password", async ({ page }) => {
    const email = uniqueEmail();
    await page.goto("/sign-up");
    await page.getByLabel("Family name").fill("Wrongpass Fam");
    await page.getByLabel("Your name").fill("Sam");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("rightpassword1");
    await page.getByLabel(/parent or guardian/i).check();
    await page.getByRole("button", { name: /create family/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/); // wait for sign-out to complete

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("WRONGpassword");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
  });

  test("auth pages have no WCAG A/AA/AAA violations", async ({ page }) => {
    for (const path of ["/sign-up", "/sign-in"]) {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag2aaa"])
        .analyze();
      expect(results.violations, `axe violations on ${path}`).toEqual([]);
    }
  });
});
