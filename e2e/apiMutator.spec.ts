import { expect, test } from "@playwright/test";

const httpErrorStatuses = [400, 401, 403, 404, 500];

for (const { contentType, body } of [
  {
    contentType: "application/xml",
    body: '<?xml version="1.0"?><Error><Message>Access Denied</Message></Error>',
  },
  {
    contentType: "text/html",
    body: "<html><body><h1>Access Denied</h1></body></html>",
  },
]) {
  test(`shows a plain error for ${contentType} gateway responses`, async ({ page }) => {
    await page.route("**/api/v1/branches", (route) => route.fulfill({
      status: 403,
      contentType,
      body,
    }));

    await page.goto("/branches");

    await expect(page.locator(".page-error")).toHaveText("The backend returned status 403.");
  });
}

for (const status of httpErrorStatuses) {
  test(`preserves HTTP ${status} when the response body is invalid JSON`, async ({ page }) => {
    await page.route("**/api/v1/branches", (route) => route.fulfill({
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
    await page.route("**/api/v1/branches", (route) => route.fulfill({
      status,
      body: "",
    }));

    await page.goto("/branches");

    await expect(page.locator(".page-error")).toHaveText("Empty response");
    await expect(page.getByText(/Status 503/)).toHaveCount(0);
  });
}

test("returns a synthetic 503 when the backend cannot be reached", async ({ page }) => {
  await page.route("**/api/v1/branches", (route) => route.abort());

  await page.goto("/branches");

  await expect(page.locator(".page-error")).toHaveText(
    "Status 503: The app could not complete the backend request. Please try again later.",
  );
});
