import { expect, test } from "@playwright/test";

test("loads Simulator options and shows the empty four-column screen", async ({ page }) => {
  let currentDate = "2026-08-26";
  let optionsRequests = 0;

  await page.route("http://localhost:8080/simulator/date", async (route) => {
    if (route.request().method() === "PUT") {
      currentDate = route.request().postDataJSON().currentDate;
    }

    await route.fulfill({ json: { currentDate } });
  });
  await page.route("http://localhost:8080/simulator/options", async (route) => {
    optionsRequests += 1;
    await route.fulfill({
      json: {
        products: [{ id: 1, code: "PROD0001", name: "Checking", type: "DEPOSIT" }],
        branches: [{ id: 2, code: "BRANCH0001", name: "Main Branch" }],
        fees: [{
          id: 3,
          code: "FEE0001",
          name: "Monthly Fee",
          type: "FLAT",
          productTypes: ["DEPOSIT"],
        }],
        attributes: [{
          id: 4,
          code: "ATTR0001",
          name: "Account Tier",
          type: "TEXT",
          productTypes: ["DEPOSIT"],
        }],
      },
    });
  });

  await page.goto("/simulator");

  await expect(page.locator(".simulator-form-grid > .simulator-form-column")).toHaveCount(4);
  await expect(page.getByLabel("Application Date")).toHaveValue("2026-08-26");
  await expect(page.getByText("No accounts", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Product")).toBeDisabled();
  await expect(page.getByLabel("Branch")).toBeDisabled();
  await expect(page.getByLabel("Fee Name")).toBeDisabled();
  await expect(page.getByLabel("Transaction Amount")).toBeDisabled();
  await expect(
    page.locator(".simulator-form-grid").getByText("Account Attributes", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
  expect(optionsRequests).toBe(1);

  await page.getByLabel("Application Date").fill("2026-08-27");
  await expect.poll(() => currentDate).toBe("2026-08-27");
  await expect(page.getByLabel("Application Date")).toHaveValue("2026-08-27");
});

test("accepts empty Simulator option categories", async ({ page }) => {
  await page.route("http://localhost:8080/simulator/date", (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route("http://localhost:8080/simulator/options", (route) => route.fulfill({
    json: { products: [], branches: [], fees: [], attributes: [] },
  }));

  await page.goto("/simulator");

  await expect(page.locator(".page-error")).toHaveCount(0);
  await expect(page.getByLabel("Application Date")).toBeEnabled();
  await expect(page.getByText("No accounts", { exact: true })).toBeVisible();
});

test("shows an options loader error while keeping the loaded date available", async ({ page }) => {
  await page.route("http://localhost:8080/simulator/date", (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill({ status: 400, json: { message: "Application Date was rejected" } });
    }

    return route.fulfill({ json: { currentDate: "2026-08-26" } });
  });
  await page.route("http://localhost:8080/simulator/options", (route) => route.fulfill({
    status: 503,
    json: { message: "Simulator options are unavailable" },
  }));

  await page.goto("/simulator");

  await expect(
    page.getByText("Status 503: Simulator options are unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Application Date")).toBeEnabled();
  await expect(page.getByLabel("Product")).toBeDisabled();
  await expect(page.getByLabel("Branch")).toBeDisabled();
  await expect(page.getByLabel("Fee Name")).toBeDisabled();

  await page.getByLabel("Application Date").fill("2026-08-27");
  await expect(
    page.getByText("Status 400: Application Date was rejected", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Status 503: Simulator options are unavailable", { exact: true }),
  ).toBeVisible();
});
