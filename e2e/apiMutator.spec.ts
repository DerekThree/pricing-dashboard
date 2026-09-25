import { expect, test } from "@playwright/test";

import { API_PATH_PREFIX } from "../app/config/apiConfig";

const httpErrorStatuses = [400, 401, 403, 404, 500];

for (const status of httpErrorStatuses) {
  test(`preserves HTTP ${status} when the response body is invalid JSON`, async ({ page }) => {
    await page.route(`**${API_PATH_PREFIX}/branches`, (route) => route.fulfill({
      status,
      contentType: "text/plain",
      body: "Access denied by gateway",
    }));

    await page.goto("/branches");

    await expect(page.locator(".page-error")).toHaveText("Access denied by gateway");
    await expect(page.getByText(/Status 503/)).toHaveCount(0);
  });
}

for (const status of httpErrorStatuses) {
  test(`preserves HTTP ${status} when the response body is empty`, async ({ page }) => {
    await page.route(`**${API_PATH_PREFIX}/branches`, (route) => route.fulfill({
      status,
      body: "",
    }));

    await page.goto("/branches");

    await expect(page.locator(".page-error")).toHaveText("Empty response");
    await expect(page.getByText(/Status 503/)).toHaveCount(0);
  });
}

test("returns a synthetic 503 when the backend cannot be reached", async ({ page }) => {
  await page.route(`**${API_PATH_PREFIX}/branches`, (route) => route.abort());

  await page.goto("/branches");

  await expect(page.locator(".page-error")).toHaveText(
    "Status 503: The app could not complete the backend request. Please try again later.",
  );
});
