import { expect, test } from "./fixtures";

test("home is the product introduction with shared navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Build workflows\. Ship with confidence\./ })).toBeVisible();
  await expect(page.getByText("About FlowForge")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Workflows" })).toBeVisible();

  await page.getByRole("link", { name: "Workflows" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: "Workflows" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current", "page");
});

test("workflow dashboard supports search and destructive confirmation", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your workflows" })).toBeVisible();
  await expect(page.getByRole("link", { name: "FlowForge home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Workflows" })).toHaveAttribute("aria-current", "page");

  const search = page.getByPlaceholder("Search workflows…");
  await search.fill("Request");
  await expect(page.getByRole("table").getByText("Request routing")).toBeVisible();
  await expect(page.getByText("Showing 1 of 1 workflows")).toBeVisible();

  await search.fill("");
  await page.getByRole("table").getByRole("button", { name: "Delete" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Delete workflow?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
