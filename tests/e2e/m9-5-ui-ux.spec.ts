import { expect, test } from "./fixtures";

test("home is the product introduction, not a separate About section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build workflows with FlowForge." })).toBeVisible();
  await expect(page.getByText("About FlowForge")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Workflows" })).toBeVisible();
});

test("workflow dashboard supports search and destructive confirmation", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your workflows" })).toBeVisible();

  const search = page.getByPlaceholder("Search workflows…");
  await search.fill("Request");
  await expect(page.getByText("Request routing")).toBeVisible();
  await expect(page.getByText("Showing 1 of 1 workflows")).toBeVisible();

  await search.fill("");
  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Delete workflow?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
