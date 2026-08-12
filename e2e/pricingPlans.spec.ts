import { expect, test } from "@playwright/test";

test("shows the Pricing Plans page", async ({ page }) => {
  await page.route("http://localhost:8080/pricing-plans", (route) => route.fulfill({ json: [] }));

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Pricing Plans" })).toBeVisible();
});
