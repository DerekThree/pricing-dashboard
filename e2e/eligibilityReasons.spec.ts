import { expect, test } from "@playwright/test";

test("derives Eligibility Reason Product Types from its condition Attributes", async ({ page }) => {
  await page.route("http://localhost:8080/eligibility-reasons/options", (route) => route.fulfill({
    json: {
      attributes: [
        {
          id: 1,
          code: "BALANCE",
          name: "Minimum Balance",
          type: "DECIMAL",
          productTypes: ["DEPOSIT", "CD"],
        },
        {
          id: 2,
          code: "ACTIVE",
          name: "Is Active",
          type: "BOOLEAN",
          productTypes: ["DEPOSIT", "CREDIT"],
        },
      ],
    },
  }));

  await page.goto("/eligibility-reasons/create");

  const conditionsColumn = page.locator(".crud-page-form-column").nth(1);
  const fields = conditionsColumn.locator(":scope > *");
  const productTypesField = fields.nth(1);
  await expect(fields).toHaveCount(2);
  await expect(fields.nth(0)).toContainText("Conditions");
  await expect(productTypesField).toContainText("Applicable Product Types");
  await expect(productTypesField.getByRole("combobox")).toHaveCount(0);
  await expect(productTypesField.locator(".ag-row")).toHaveCount(3);

  await fields.nth(0).getByRole("button", { name: "Add" }).click();
  await expect(productTypesField.locator(".ag-row")).toHaveCount(0);
  await expect(productTypesField).toContainText("No applicable product types");

  const conditionEditor = page.locator(".eligibility-reason-condition-editor");
  await conditionEditor.locator(".dropdown__control").nth(0).click();
  await page.getByRole("option", { name: "BALANCE - Minimum Balance" }).click();
  await expect(productTypesField.locator(".ag-row")).toHaveCount(2);
  await expect(productTypesField.getByText("Standard Deposit", { exact: true })).toBeVisible();
  await expect(
    productTypesField.getByText("Certificate of Deposit", { exact: true }),
  ).toBeVisible();

  await fields.nth(0).getByRole("button", { name: "Add" }).click();
  await conditionEditor.locator(".dropdown__control").nth(0).click();
  await page.getByRole("option", { name: "ACTIVE - Is Active" }).click();
  await expect(productTypesField.locator(".ag-row")).toHaveCount(1);
  await expect(productTypesField.getByText("Standard Deposit", { exact: true })).toBeVisible();
});
