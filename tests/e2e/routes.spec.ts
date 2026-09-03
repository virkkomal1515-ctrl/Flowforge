import { expect, test } from "./fixtures";

test("dashboard route renders", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your workflows" })).toBeVisible();
});

test("workflow route renders", async ({ page }) => {
  await page.goto("/workflows/demo");
  await expect(page.getByRole("heading", { name: "Workflow demo" })).toBeVisible();
});
