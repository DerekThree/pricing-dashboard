import { expect, test } from "@playwright/test";
import { API_PATH_PREFIX } from "../app/config/apiConfig";

test("selects and submits Product Types below Attribute Type", async ({ page }) => {
  let requestBody: unknown;
  await page.route(`**${API_PATH_PREFIX}/account-attributes`, async (route) => {
    if (route.request().method() === "POST") {
      requestBody = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: {} });
      return;
    }

    await route.fulfill({ json: [] });
  });

  await page.goto("/account-attributes/create");
  await page.getByLabel("Attribute Code").fill("age");
  await page.getByLabel("Attribute Name").fill("Account Age");

  const formColumn = page.locator(".crud-page-form-column").nth(1);
  const fields = formColumn.locator(":scope > *");
  await expect(fields).toHaveCount(2);

  await formColumn.locator(".dropdown__control").nth(0).click();
  await page.getByText("Integer", { exact: true }).click();
  await formColumn.locator(".dropdown__control").nth(1).click();
  await page.getByText("Standard Deposit", { exact: true }).click();
  await formColumn.locator(".dropdown__control").nth(1).click();
  await page.getByText("Credit", { exact: true }).click();
  await expect(formColumn.getByText("Standard Deposit", { exact: true })).toBeVisible();
  await expect(formColumn.getByText("Credit", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Create" }).click();

  await expect.poll(() => requestBody).toEqual({
    attributeCode: "AGE",
    attributeName: "Account Age",
    attributeType: "INTEGER",
    productTypes: ["DEPOSIT", "CREDIT"],
    updatedBy: "user",
  });
});

test("displays Account Attribute Product Types on the list", async ({ page }) => {
  await page.route(`**${API_PATH_PREFIX}/account-attributes`, (route) => route.fulfill({
    json: [{
      id: 1,
      attribute: "ATTR0001 - Account Age",
      type: "INTEGER",
      productTypes: ["DEPOSIT", "CD"],
      updatedOn: "2026-08-16T09:00:00Z",
      updatedBy: "Derek Ochal",
    }],
  }));

  await page.goto("/account-attributes");

  await expect(page.getByText("Standard Deposit, Certificate of Deposit", { exact: true }))
    .toBeVisible();
});
