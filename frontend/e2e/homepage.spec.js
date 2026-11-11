import { test, expect } from "@playwright/test";

test("homepage should load successfully", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /get started/i })).toBeVisible();
});
