import { expect, test } from "@playwright/test";

test.describe("Milestone 9 accessibility", () => {
  test("exposes landmarks, labelled controls, and keyboard-focusable actions", async ({ page }) => {
    await page.goto("/workflows/canvas-demo");

    await expect(page.getByRole("region", { name: "Workflow validation" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Workflow canvas" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Properties panel" })).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Action" })).toBeVisible();

    await page.getByRole("group", { name: "Workflow action" }).click();
    const actionName = page.getByLabel("Action name");
    await expect(actionName).toBeVisible();
    await actionName.focus();
    await expect(actionName).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Operation")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Parameter")).toBeFocused();
  });

  test("exposes validation errors through alert semantics", async ({ page }) => {
    await page.goto("/workflows/canvas-demo");
    await expect(page.getByRole("region", { name: "Workflow validation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeEnabled();

    await page.getByRole("group", { name: "Workflow notification" }).click();
    await page.getByLabel("Recipient").fill("not-an-email");
    await page.getByRole("button", { name: "Apply changes" }).click();

    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByLabel("Recipient")).toHaveAttribute("aria-invalid", "true");
  });
});
