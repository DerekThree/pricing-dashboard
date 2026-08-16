import { expect, test } from "@playwright/test";

test("requires Product Types before creating a Fee", async ({ page }) => {
  await page.goto("/fees/create");
  await page.getByLabel("Fee Code").fill("FEE00001");
  await page.getByLabel("Fee Name").fill("Monthly Maintenance Fee");
  await page.locator(".dropdown__control").first().click();
  await page.getByText("Flat", { exact: true }).click();
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText("Select at least one Product Type.")).toBeVisible();
});
