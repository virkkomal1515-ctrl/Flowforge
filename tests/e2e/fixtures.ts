import { test as base, expect } from "@playwright/test";
import { sampleWorkflow } from "../../lib/workflow/sample-workflow";

export { expect };

export const test = base.extend({
  page: async ({ page }, fixturePage) => {
    const workflow = structuredClone(sampleWorkflow);
    await page.route("**/api/workflows", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ workflows: [workflow] }) });
    });
    await page.route("**/api/workflows/**", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/publish") || path.endsWith("/execute")) return route.continue();
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(workflow) });
    });
    await fixturePage(page);
  },
});
