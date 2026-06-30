import { test, expect } from "@playwright/test";

test("iOS visitors get an install banner and an Add-to-Home-Screen guide", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "Mobile Safari",
    "Exercises the iOS install path.",
  );

  await page.goto("/");
  const install = page.getByRole("button", { name: "Install", exact: true });
  await expect(install).toBeVisible();

  await install.click();
  await expect(page.getByText("Add Pointsy to your home screen")).toBeVisible();
  // Exact match: the marketing copy also contains "add to home screen".
  await expect(
    page.getByText("Add to Home Screen", { exact: true }),
  ).toBeVisible();
  // The step that trips people up is called out.
  await expect(page.getByText(/Show More/i)).toBeVisible();
});
