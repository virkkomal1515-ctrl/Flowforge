import { expect, test } from "./fixtures";

test("home is the product introduction with shared navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Build workflows\. Ship with confidence\./ })).toBeVisible();
  await expect(page.getByText("About FlowForge")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Workflows", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Workflows", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: "Workflows", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Home", exact: true })).not.toHaveAttribute("aria-current", "page");
});

test("workflow dashboard supports search and destructive confirmation", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your workflows" })).toBeVisible();
  await expect(page.getByRole("link", { name: "FlowForge home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Workflows", exact: true })).toHaveAttribute("aria-current", "page");

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
