import { expect, test } from "./fixtures";

test.describe("Milestone 3 workflow canvas", () => {
  test("renders the editor and all five node types", async ({ page }) => {
    await page.goto("/workflows/canvas-demo");
    await expect(page.getByRole("heading", { name: "Workflow canvas-demo" })).toBeVisible();
    for (const label of ["Trigger", "Action", "Condition", "Notification", "End"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test("selects and deletes a node", async ({ page }) => {
    await page.goto("/workflows/canvas-demo");
    await page.getByText("Action", { exact: true }).first().click();
    await expect(page.getByText("Selected node", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Delete selected" }).click();
    await expect(page.getByText("1 node deleted.", { exact: true })).toBeVisible();
  });

  test("adds a node from the palette", async ({ page }) => {
    await page.goto("/workflows/canvas-demo");
    await page.getByRole("button", { name: "+ Action" }).click();
    await expect(page.getByText("Action node added.", { exact: true })).toBeVisible();
  });
});
