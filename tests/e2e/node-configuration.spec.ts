import { expect, test } from "./fixtures";

test("open workflow, select node, edit configuration, and apply", async ({ page }) => {
  await page.goto("/workflows/demo");
  await expect(page.getByText("Request routing")).toBeVisible();
  const action = page.getByRole("group", { name: "Workflow action" });
  await action.click();
  await expect(page.getByRole("heading", { name: "action" })).toBeVisible();
  await page.getByLabel("Action name").fill("Route request");
  await page.getByRole("button", { name: "Apply changes" }).click();
  await expect(page.getByText("Node configuration updated.")).toBeVisible();
  await expect(action).toContainText("Route request");
});
