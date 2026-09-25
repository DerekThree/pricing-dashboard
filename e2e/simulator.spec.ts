import { expect, type Locator, test } from "@playwright/test";

import { API_PATH_PREFIX } from "../app/config/apiConfig";
import type { BatchRequest, SimulatorOptions } from "../app/generated/api/models";

const demoProducts: SimulatorOptions["products"] = [
  { id: 101, code: "CHK", name: "Everyday Checking", type: "CD" },
  { id: 102, code: "SAV", name: "High Yield Savings", type: "CD" },
  { id: 103, code: "AUTO", name: "Auto Loan", type: "CD" },
  { id: 104, code: "CD12", name: "12 Month Certificate", type: "CD" },
  { id: 105, code: "CHKPLUS", name: "Premium Checking", type: "CD" },
];
const demoBranches: SimulatorOptions["branches"] = [
  { id: 101, code: "BR100", name: "Downtown Branch" },
  { id: 102, code: "BR101", name: "Harbor Branch" },
  { id: 103, code: "BR200", name: "Lakeside Branch" },
  { id: 104, code: "BR201", name: "Northside Branch" },
  { id: 105, code: "BR300", name: "Hill Country Branch" },
];

function withDemoOptions(options: SimulatorOptions): SimulatorOptions {
  return {
    ...options,
    products: [...options.products, ...demoProducts],
    branches: [...options.branches, ...demoBranches],
  };
}

async function addSingleDraft(accounts: Locator) {
  await accounts.getByRole("button", { name: "Add" }).click();
  for (let index = 0; index < 4; index += 1) {
    await accounts.getByRole("button", { name: "X" }).last().click();
  }
}

function accountRow(accounts: Locator, accountNumber: string) {
  return accounts.locator(".ag-row").filter({ hasText: accountNumber });
}

test("loads Simulator options and shows the empty four-column screen", async ({ page }) => {
  let currentDate = "2026-08-26";
  let optionsRequests = 0;

  await page.route(`**${API_PATH_PREFIX}/simulator/date`, async (route) => {
    if (route.request().method() === "PUT") {
      currentDate = route.request().postDataJSON().currentDate;
    }

    await route.fulfill({ json: { currentDate } });
  });
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, async (route) => {
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
  await expect(page.getByLabel("Application Date")).toHaveValue("08/26/2026");
  await expect(page.getByText("No accounts", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Product")).toBeDisabled();
  await expect(page.getByLabel("Branch")).toBeDisabled();
  await expect(page.getByLabel("Fee Name")).toBeDisabled();
  await expect(page.getByLabel("Transaction Amount")).toBeDisabled();
  await expect(page.getByLabel("Account Tier")).toHaveCount(0);
  await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
  expect(optionsRequests).toBe(1);

  await page.getByLabel("Application Date").fill("08/27/2026");
  await expect.poll(() => currentDate).toBe("2026-08-27");
  await expect(page.getByLabel("Application Date")).toHaveValue("08/27/2026");
});

test("adds, selects, and removes five incomplete demo Account drafts", async ({ page }) => {
  await page.route(`**${API_PATH_PREFIX}/simulator/date`, (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
    json: withDemoOptions({
      products: [{ id: 1, code: "PROD0001", name: "Checking", type: "DEPOSIT" }],
      branches: [{ id: 2, code: "BRANCH0001", name: "Main Branch" }],
      fees: [],
      attributes: [],
    }),
  }));

  await page.goto("/simulator");

  const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
  await accounts.getByRole("button", { name: "Add" }).click();

  await expect(accounts.locator(".ag-row")).toHaveCount(5);
  await expect(accounts.getByText("Incomplete", { exact: true })).toHaveCount(5);
  await expect(accounts.getByRole("button", { name: "Add" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  await expect(page.getByLabel("Product")).toBeEnabled();
  await expect(page.getByLabel("Branch")).toBeEnabled();

  for (let index = 0; index < 5; index += 1) {
    await accounts.getByRole("button", { name: "X" }).last().click();
  }

  await expect(accounts.getByText("No accounts", { exact: true })).toBeVisible();
  await expect(accounts.getByRole("button", { name: "Add" })).toBeEnabled();
  await expect(page.getByLabel("Product")).toBeDisabled();
  await expect(page.getByLabel("Branch")).toBeDisabled();
});

test("edits typed Product-dependent Account Attributes", async ({ page }) => {
  await page.route(`**${API_PATH_PREFIX}/simulator/date`, (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
    json: withDemoOptions({
      products: [
        { id: 1, code: "PROD0001", name: "Checking", type: "DEPOSIT" },
        { id: 2, code: "PROD0002", name: "Credit Card", type: "CREDIT" },
        { id: 3, code: "PROD0003", name: "Certificate", type: "CD" },
      ],
      branches: [
        { id: 4, code: "BRANCH0001", name: "Main Branch" },
        { id: 10, code: "BRANCH0002", name: "West Branch" },
      ],
      fees: [],
      attributes: [
        {
          id: 5,
          code: "TIER",
          name: "Account Tier",
          type: "TEXT",
          productTypes: ["DEPOSIT", "CREDIT"],
        },
        {
          id: 6,
          code: "BALANCE",
          name: "Balance",
          type: "DECIMAL",
          productTypes: ["DEPOSIT"],
        },
        {
          id: 7,
          code: "TERM",
          name: "Term Months",
          type: "INTEGER",
          productTypes: ["DEPOSIT"],
        },
        {
          id: 8,
          code: "OPENED_ON",
          name: "Opened On",
          type: "DATE",
          productTypes: ["DEPOSIT"],
        },
        {
          id: 9,
          code: "VIP",
          name: "VIP",
          type: "BOOLEAN",
          productTypes: ["DEPOSIT"],
        },
      ],
    }),
  }));

  await page.goto("/simulator");
  const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
  await addSingleDraft(accounts);

  await page.getByLabel("Product").click();
  await page.getByText("PROD0001 - Checking", { exact: true }).click();
  await page.getByLabel("Branch").click();
  await page.getByText("BRANCH0001 - Main Branch", { exact: true }).click();

  await expect(page.getByLabel("Account Tier")).toHaveAttribute("required", "");
  await expect(page.getByLabel("Balance")).toHaveAttribute("type", "number");
  await expect(page.getByLabel("Balance")).toHaveAttribute("step", "any");
  await expect(page.getByLabel("Term Months")).toHaveAttribute("type", "number");
  await expect(page.getByLabel("Opened On")).toHaveAttribute("required", "");
  await expect(page.getByLabel("VIP")).toHaveAttribute("aria-required", "true");

  await page.getByLabel("Account Tier").fill("Gold");
  await page.getByLabel("Balance").fill("125.50");
  await page.getByLabel("Term Months").fill("12");
  await page.getByLabel("Opened On").fill("08/20/2026");
  await page.getByLabel("VIP").click();
  await page.getByText("False", { exact: true }).click();

  await page.getByLabel("Branch").click();
  await page.getByText("BRANCH0002 - West Branch", { exact: true }).click();
  await expect(page.getByLabel("Account Tier")).toHaveValue("Gold");
  await expect(page.getByLabel("Balance")).toHaveValue("125.5");
  await expect(page.getByLabel("Term Months")).toHaveValue("12");
  await expect(page.getByLabel("Opened On")).toHaveValue("08/20/2026");
  await expect(page.getByText("False", { exact: true })).toBeVisible();

  await page.getByLabel("Product").click();
  await page.getByText("PROD0002 - Credit Card", { exact: true }).click();

  await expect(page.getByLabel("Account Tier")).toHaveValue("Gold");
  await expect(page.getByLabel("Balance")).toHaveCount(0);
  await expect(page.getByLabel("Term Months")).toHaveCount(0);
  await expect(page.getByLabel("Opened On")).toHaveCount(0);
  await expect(page.getByLabel("VIP")).toHaveCount(0);
  await expect(page.getByText("West Branch", { exact: true })).toBeVisible();

  await page.getByLabel("Product").click();
  await page.getByText("PROD0003 - Certificate", { exact: true }).click();
  await expect(page.getByLabel("Account Tier")).toHaveCount(0);
});

test("composes repeated Product-dependent Fee Requests", async ({ page }) => {
  await page.route(`**${API_PATH_PREFIX}/simulator/date`, (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
    json: withDemoOptions({
      products: [
        { id: 1, code: "PROD0001", name: "Checking", type: "DEPOSIT" },
        { id: 2, code: "PROD0002", name: "Credit Card", type: "CREDIT" },
      ],
      branches: [
        { id: 3, code: "BRANCH0001", name: "Main Branch" },
        { id: 6, code: "BRANCH0002", name: "West Branch" },
      ],
      fees: [
        {
          id: 4,
          code: "WIRE",
          name: "Wire Fee",
          type: "PERCENT",
          productTypes: ["DEPOSIT", "CREDIT"],
        },
        {
          id: 5,
          code: "MONTHLY",
          name: "Monthly Fee",
          type: "FLAT",
          productTypes: ["DEPOSIT"],
        },
      ],
      attributes: [],
    }),
  }));

  await page.goto("/simulator");
  const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
  const feeRequests = page.locator(".selection-list").filter({ hasText: "Fees" });
  await addSingleDraft(accounts);
  await page.getByLabel("Product").click();
  await page.getByText("PROD0001 - Checking", { exact: true }).click();

  await expect(feeRequests.getByRole("button", { name: "Add" })).toBeEnabled();
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await expect(feeRequests.getByText("Incomplete", { exact: true })).toBeVisible();
  await expect(feeRequests.getByRole("button", { name: "Add" })).toBeDisabled();
  await expect(page.getByLabel("Fee Name")).toHaveAttribute("aria-required", "false");
  await expect(page.getByLabel("Transaction Amount")).not.toHaveAttribute("required");

  await page.getByLabel("Fee Name").click();
  await page.getByText("WIRE - Wire Fee", { exact: true }).click();
  await expect(page.getByLabel("Transaction Amount")).toBeEnabled();
  await expect(page.getByLabel("Transaction Amount")).toHaveValue("");
  await page.getByLabel("Transaction Amount").fill("125.50");
  await expect(feeRequests.getByText("Wire Fee", { exact: true })).toBeVisible();

  await feeRequests.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Fee Name").click();
  await page.getByText("WIRE - Wire Fee", { exact: true }).click();
  await page.getByLabel("Transaction Amount").fill("25");
  await expect(feeRequests.getByText("Wire Fee", { exact: true })).toHaveCount(2);

  await page.getByLabel("Fee Name").click();
  await page.getByText("MONTHLY - Monthly Fee", { exact: true }).click();
  await expect(page.getByLabel("Transaction Amount")).toBeDisabled();
  await expect(page.getByLabel("Transaction Amount")).toHaveValue("");
  await page.getByLabel("Fee Name").click();
  await page.getByText("WIRE - Wire Fee", { exact: true }).click();
  await expect(page.getByLabel("Transaction Amount")).toBeEnabled();
  await expect(page.getByLabel("Transaction Amount")).toHaveValue("");
  await expect(feeRequests.getByText("Incomplete", { exact: true })).toBeVisible();

  await page.getByLabel("Transaction Amount").fill("30");
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Fee Name").click();
  await page.getByText("MONTHLY - Monthly Fee", { exact: true }).click();
  await expect(feeRequests.getByText("Monthly Fee", { exact: true })).toBeVisible();
  await page.getByLabel("Branch").click();
  await page.getByText("BRANCH0001 - Main Branch", { exact: true }).click();
  await page.getByLabel("Branch").click();
  await page.getByText("BRANCH0002 - West Branch", { exact: true }).click();
  await expect(feeRequests.getByText("Wire Fee", { exact: true })).toHaveCount(2);
  await expect(feeRequests.getByText("Monthly Fee", { exact: true })).toBeVisible();
  await expect(accountRow(accounts, "10000001")).toBeVisible();
  await expect(accounts.getByRole("button", { name: "Add" })).toBeEnabled();

  await page.getByLabel("Product").click();
  await page.getByText("PROD0002 - Credit Card", { exact: true }).click();
  await expect(feeRequests.getByText("Wire Fee", { exact: true })).toHaveCount(2);
  await expect(feeRequests.getByText("Monthly Fee", { exact: true })).toHaveCount(0);
  await expect(page.getByText("West Branch", { exact: true })).toBeVisible();

  await feeRequests.locator(".ag-row").nth(1).click();
  await feeRequests.locator(".ag-row").nth(1).getByRole("button", { name: "X" }).click();
  await expect(feeRequests.getByText("Wire Fee", { exact: true })).toHaveCount(1);
  await feeRequests.getByRole("button", { name: "X" }).click();
  await expect(feeRequests.getByText("No fees", { exact: true })).toBeVisible();
  await expect(accounts.getByText("Incomplete", { exact: true })).toBeVisible();
  await expect(accounts.getByRole("button", { name: "Add" })).toBeDisabled();
});

test("retains independent Account drafts and never reuses Account Numbers", async ({ page }) => {
  await page.route(`**${API_PATH_PREFIX}/simulator/date`, (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
    json: withDemoOptions({
      products: [
        { id: 1, code: "PROD0001", name: "Checking", type: "DEPOSIT" },
        { id: 2, code: "PROD0002", name: "Credit Card", type: "CREDIT" },
      ],
      branches: [
        { id: 3, code: "BRANCH0001", name: "Main Branch" },
        { id: 4, code: "BRANCH0002", name: "West Branch" },
      ],
      fees: [{
        id: 5,
        code: "MONTHLY",
        name: "Monthly Fee",
        type: "FLAT",
        productTypes: ["DEPOSIT", "CREDIT"],
      }],
      attributes: [{
        id: 6,
        code: "NOTE",
        name: "Account Note",
        type: "TEXT",
        productTypes: ["DEPOSIT", "CREDIT"],
      }],
    }),
  }));

  await page.goto("/simulator");
  const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
  const feeRequests = page.locator(".selection-list").filter({ hasText: "Fees" });

  async function completeAccount(product: string, branch: string, note: string) {
    await page.getByLabel("Product").click();
    await page.getByText(product, { exact: true }).click();
    await page.getByLabel("Branch").click();
    await page.getByText(branch, { exact: true }).click();
    await page.getByLabel("Account Note").fill(note);
    await feeRequests.getByRole("button", { name: "Add" }).click();
    await page.getByLabel("Fee Name").click();
    await page.getByText("MONTHLY - Monthly Fee", { exact: true }).click();
  }

  await addSingleDraft(accounts);
  await completeAccount("PROD0001 - Checking", "BRANCH0001 - Main Branch", "First");
  await expect(accountRow(accounts, "10000001")).toBeVisible();

  await addSingleDraft(accounts);
  await expect(page.getByLabel("Product")).toHaveValue("");
  await expect(feeRequests.getByText("No fees", { exact: true })).toBeVisible();
  await expect(accounts.getByRole("button", { name: "Add" })).toBeDisabled();
  await accountRow(accounts, "10000001").click();
  await expect(page.getByLabel("Account Note")).toHaveValue("First");
  await accounts.getByText("Incomplete", { exact: true }).click();
  await completeAccount("PROD0002 - Credit Card", "BRANCH0002 - West Branch", "Second");
  await expect(accountRow(accounts, "10000006")).toBeVisible();

  await accountRow(accounts, "10000001").click();
  await expect(page.getByText("Checking", { exact: true })).toBeVisible();
  await expect(page.getByText("Main Branch", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Account Note")).toHaveValue("First");
  await expect(feeRequests.getByText("Monthly Fee", { exact: true })).toBeVisible();

  await accounts.locator(".ag-row").filter({ hasText: "10000001" })
    .getByRole("button", { name: "X" }).click();
  await expect(page.getByText("Credit Card", { exact: true })).toBeVisible();
  await expect(page.getByText("West Branch", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Account Note")).toHaveValue("Second");

  await addSingleDraft(accounts);
  await completeAccount("PROD0001 - Checking", "BRANCH0001 - Main Branch", "Third");
  await expect(accountRow(accounts, "10000011")).toBeVisible();
  await accounts.locator(".ag-row").filter({ hasText: "10000011" })
    .getByRole("button", { name: "X" }).click();
  await expect(page.getByLabel("Account Note")).toHaveValue("Second");

  await accounts.getByRole("button", { name: "X" }).click();
  await expect(accounts.getByText("No accounts", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Product")).toBeDisabled();

  await addSingleDraft(accounts);
  await completeAccount("PROD0001 - Checking", "BRANCH0001 - Main Branch", "Fourth");
  await expect(accountRow(accounts, "10000016")).toBeVisible();
});

test("submits every Account and correlates Account results across Reset", async ({ page }) => {
  let currentDate = "2026-08-26";
  const requests: BatchRequest[] = [];

  await page.route(`**${API_PATH_PREFIX}/simulator/date`, async (route) => {
    if (route.request().method() === "PUT") {
      currentDate = route.request().postDataJSON().currentDate;
    }

    await route.fulfill({ json: { currentDate } });
  });
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
    json: withDemoOptions({
      products: [
        { id: 1, code: "PROD0001", name: "Checking", type: "DEPOSIT" },
        { id: 2, code: "PROD0002", name: "Credit Card", type: "CREDIT" },
      ],
      branches: [
        { id: 3, code: "BRANCH0001", name: "Main Branch" },
        { id: 4, code: "BRANCH0002", name: "West Branch" },
      ],
      fees: [
        {
          id: 5,
          code: "MONTHLY",
          name: "Monthly Fee",
          type: "FLAT",
          productTypes: ["DEPOSIT", "CREDIT"],
        },
        {
          id: 6,
          code: "WIRE",
          name: "Wire Fee",
          type: "PERCENT",
          productTypes: ["DEPOSIT", "CREDIT"],
        },
      ],
      attributes: [{
        id: 7,
        code: "TIER",
        name: "Account Tier",
        type: "TEXT",
        productTypes: ["DEPOSIT", "CREDIT"],
      }],
    }),
  }));
  await page.route(`**${API_PATH_PREFIX}/batch`, async (route) => {
    requests.push(route.request().postDataJSON() as BatchRequest);
    await route.fulfill({
      json: {
        batchId: requests.at(-1)!.batchId,
        accounts: [
          {
            accountNumber: "10000006",
            status: "OK",
            pricingPlanCode: "PLAN0002",
            fees: [],
          },
          { accountNumber: "10000001", status: "MISSING_ATTRIBUTE" },
        ],
      },
    });
  });

  await page.goto("/simulator");
  const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
  const feeRequests = page.locator(".selection-list").filter({ hasText: "Fees" });

  async function selectOption(label: string, option: string) {
    await page.getByLabel(label).click();
    await page.getByText(option, { exact: true }).click();
  }

  await expect(page.getByText("No accounts", { exact: true })).toBeVisible();
  await addSingleDraft(accounts);
  await selectOption("Product", "PROD0001 - Checking");
  await selectOption("Branch", "BRANCH0001 - Main Branch");
  await page.getByLabel("Account Tier").fill("Gold");
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await selectOption("Fee Name", "MONTHLY - Monthly Fee");
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await selectOption("Fee Name", "MONTHLY - Monthly Fee");
  await feeRequests.locator(".ag-row").first().getByRole("button", { name: "X" }).click();
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await selectOption("Fee Name", "MONTHLY - Monthly Fee");

  await addSingleDraft(accounts);
  await selectOption("Product", "PROD0002 - Credit Card");
  await selectOption("Branch", "BRANCH0002 - West Branch");
  await page.getByLabel("Account Tier").fill("Silver");
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await selectOption("Fee Name", "WIRE - Wire Fee");
  await page.getByLabel("Transaction Amount").fill("250.5");

  await page.getByRole("button", { name: "Send" }).click();
  const reset = page.getByRole("button", { name: "Reset" });
  await expect(reset).toBeEnabled();
  await expect.poll(() => requests.length).toBe(1);

  const firstBatchId = requests[0].batchId;
  expect(firstBatchId).toEqual(expect.any(String));
  expect(firstBatchId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(requests[0]).toEqual({
    batchId: firstBatchId,
    accounts: [
      {
        accountNumber: "10000001",
        productCode: "PROD0001",
        branchCode: "BRANCH0001",
        pricingDate: "2026-08-26",
        attributes: [{ code: "TIER", value: "Gold" }],
        fees: [
          { feeRequestId: 2, code: "MONTHLY" },
          { feeRequestId: 3, code: "MONTHLY" },
        ],
      },
      {
        accountNumber: "10000006",
        productCode: "PROD0002",
        branchCode: "BRANCH0002",
        pricingDate: "2026-08-26",
        attributes: [{ code: "TIER", value: "Silver" }],
        fees: [{ feeRequestId: 1, code: "WIRE", transactionAmount: 250.5 }],
      },
    ],
  });
  await expect(page.getByRole("button", { name: "Send" })).toHaveCount(0);
  await expect(page.getByLabel("Application Date")).toBeEnabled();
  await expect(page.getByLabel("Product")).toBeDisabled();
  await expect(page.getByLabel("Branch")).toBeDisabled();
  await expect(page.getByLabel("Account Tier")).toBeDisabled();
  await expect(page.getByLabel("Fee Name")).toBeDisabled();
  await expect(page.getByLabel("Transaction Amount")).toBeDisabled();
  await expect(accounts.getByRole("button", { name: "Add" })).toHaveCount(0);
  await expect(accounts.getByRole("button", { name: "X" })).toHaveCount(0);
  await expect(feeRequests.getByRole("button", { name: "Add" })).toHaveCount(0);
  await expect(feeRequests.getByRole("button", { name: "X" })).toHaveCount(0);
  await expect(reset).toHaveClass(/page-top-menu-action--cancel/);
  await expect(page.locator(".simulator-response-value")).toHaveText(["OK", "PLAN0002"]);
  await accountRow(accounts, "10000001").click();
  await expect(page.locator(".simulator-response-value")).toHaveText([
    "MISSING_ATTRIBUTE",
    "",
  ]);
  await accountRow(accounts, "10000006").click();

  await reset.click();
  await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
  await expect(page.getByLabel("Product")).toBeEnabled();
  await expect(page.getByLabel("Account Tier")).toHaveValue("Silver");
  await expect(page.getByLabel("Transaction Amount")).toHaveValue("250.5");
  await expect(accounts.getByRole("button", { name: "Add" })).toBeVisible();
  await expect(feeRequests.getByRole("button", { name: "Add" })).toBeVisible();

  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("button", { name: "Reset" })).toBeEnabled();
  expect(requests).toHaveLength(2);
  expect(requests[1].batchId).not.toBe(firstBatchId);
});

test("correlates reordered Fee Pricing Decisions and shows only outcome fields", async ({
  page,
}) => {
  await page.route(`**${API_PATH_PREFIX}/simulator/date`, (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
    json: withDemoOptions({
      products: [{ id: 1, code: "PROD0001", name: "Checking", type: "DEPOSIT" }],
      branches: [{ id: 2, code: "BRANCH0001", name: "Main Branch" }],
      fees: [
        {
          id: 3,
          code: "MONTHLY",
          name: "Monthly Fee",
          type: "FLAT",
          productTypes: ["DEPOSIT"],
        },
        {
          id: 4,
          code: "WIRE",
          name: "Wire Fee",
          type: "PERCENT",
          productTypes: ["DEPOSIT"],
        },
      ],
      attributes: [],
    }),
  }));
  await page.route(`**${API_PATH_PREFIX}/batch`, async (route) => {
    const request = route.request().postDataJSON() as BatchRequest;

    expect(request.accounts[0].fees).toEqual([
      { feeRequestId: 1, code: "MONTHLY" },
      { feeRequestId: 2, code: "MONTHLY" },
      { feeRequestId: 3, code: "WIRE", transactionAmount: 100 },
    ]);
    expect(request.accounts[1].fees).toEqual([
      { feeRequestId: 1, code: "MONTHLY" },
    ]);
    await route.fulfill({
      json: {
        batchId: request.batchId,
        accounts: [
          {
            accountNumber: "10000006",
            status: "OK",
            pricingPlanCode: "PLAN0002",
            fees: [{ feeRequestId: 1, status: "OK", decision: "CHARGED", amount: 3 }],
          },
          {
            accountNumber: "10000001",
            status: "OK",
            pricingPlanCode: "PLAN0001",
            fees: [
              { feeRequestId: 2, status: "OK", decision: "CHARGED", amount: 12.5 },
              { feeRequestId: 3, status: "ERROR" },
              {
                feeRequestId: 1,
                status: "OK",
                decision: "WAIVED",
                reasons: ["LOYALTY", "VIP"],
              },
            ],
          },
        ],
      },
    });
  });

  await page.goto("/simulator");
  const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
  const feeRequests = page.locator(".selection-list").filter({ hasText: "Fees" });

  async function selectOption(label: string, option: string) {
    await page.getByLabel(label).click();
    await page.getByText(option, { exact: true }).click();
  }

  await addSingleDraft(accounts);
  await selectOption("Product", "PROD0001 - Checking");
  await selectOption("Branch", "BRANCH0001 - Main Branch");

  await feeRequests.getByRole("button", { name: "Add" }).click();
  await selectOption("Fee Name", "MONTHLY - Monthly Fee");
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await selectOption("Fee Name", "MONTHLY - Monthly Fee");
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await selectOption("Fee Name", "WIRE - Wire Fee");
  await page.getByLabel("Transaction Amount").fill("100");

  await addSingleDraft(accounts);
  await selectOption("Product", "PROD0001 - Checking");
  await selectOption("Branch", "BRANCH0001 - Main Branch");
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await selectOption("Fee Name", "MONTHLY - Monthly Fee");

  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("button", { name: "Reset" })).toBeEnabled();
  await accountRow(accounts, "10000001").click();

  const feeResponse = page.locator(".simulator-fee-response");
  await expect(feeResponse.getByText("Wire Fee", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("ERROR", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("Decision", { exact: true })).toHaveCount(0);
  await expect(feeResponse.getByText("Amount", { exact: true })).toHaveCount(0);
  await expect(feeResponse.getByText("Eligibility Reasons", { exact: true })).toHaveCount(0);
  await expect(feeResponse.locator("input")).toHaveCount(0);

  await feeRequests.locator(".ag-row").first().click();
  await expect(feeResponse.getByText("Monthly Fee", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("OK", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("Decision", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("WAIVED", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("Amount", { exact: true })).toHaveCount(0);
  const reasons = feeResponse.locator(".selection-list").filter({
    hasText: "Eligibility Reasons",
  });
  await expect(reasons.getByText("LOYALTY", { exact: true })).toBeVisible();
  await expect(reasons.getByText("VIP", { exact: true })).toBeVisible();
  await expect(reasons.locator(".selection-list-table-disabled")).toBeVisible();
  await expect(feeResponse.locator("input")).toHaveCount(0);

  await feeRequests.locator(".ag-row").nth(1).click();
  await expect(feeResponse.getByText("OK", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("Decision", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("CHARGED", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("Amount", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("12.5", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("Eligibility Reasons", { exact: true })).toHaveCount(0);
  await expect(feeResponse.locator("input")).toHaveCount(0);

  await accountRow(accounts, "10000006").click();
  await expect(feeResponse.getByText("Monthly Fee", { exact: true })).toBeVisible();
  await expect(feeResponse.getByText("3", { exact: true })).toBeVisible();
  await accountRow(accounts, "10000001").click();
  await expect(feeResponse.getByText("12.5", { exact: true })).toBeVisible();
});

test("restores editable drafts after Batch HTTP and network failures", async ({ page }) => {
  let batchRequests = 0;

  await page.route(`**${API_PATH_PREFIX}/simulator/date`, (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
    json: withDemoOptions({
      products: [{ id: 1, code: "PROD0001", name: "Checking", type: "DEPOSIT" }],
      branches: [{ id: 2, code: "BRANCH0001", name: "Main Branch" }],
      fees: [{
        id: 3,
        code: "MONTHLY",
        name: "Monthly Fee",
        type: "FLAT",
        productTypes: ["DEPOSIT"],
      }],
      attributes: [],
    }),
  }));
  await page.route(`**${API_PATH_PREFIX}/batch`, (route) => {
    batchRequests += 1;
    return batchRequests === 1
      ? route.fulfill({ status: 503, json: { message: "Batch unavailable" } })
      : route.abort("failed");
  });

  await page.goto("/simulator");
  const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
  const feeRequests = page.locator(".selection-list").filter({ hasText: "Fees" });
  await addSingleDraft(accounts);
  await page.getByLabel("Product").click();
  await page.getByText("PROD0001 - Checking", { exact: true }).click();
  await page.getByLabel("Branch").click();
  await page.getByText("BRANCH0001 - Main Branch", { exact: true }).click();
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Fee Name").click();
  await page.getByText("MONTHLY - Monthly Fee", { exact: true }).click();

  const send = page.getByRole("button", { name: "Send" });
  await send.click();
  await expect(page.getByText("Status 503: Batch unavailable", { exact: true })).toBeVisible();
  await expect(send).toBeEnabled();
  await expect(page.getByLabel("Product")).toBeEnabled();
  await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
  await expect(accounts.getByRole("button", { name: "Add" })).toBeVisible();
  await expect(feeRequests.getByRole("button", { name: "Add" })).toBeVisible();

  await send.click();
  await expect(page.getByText(
    "Status 503: The app could not complete the backend request. Please try again later.",
    { exact: true },
  )).toBeVisible();
  await expect(send).toBeEnabled();
  await expect(page.getByLabel("Product")).toBeEnabled();
  await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
  expect(batchRequests).toBe(2);
});

test("accepts empty Simulator option categories", async ({ page }) => {
  await page.route(`**${API_PATH_PREFIX}/simulator/date`, (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
    json: { products: [], branches: [], fees: [], attributes: [] },
  }));

  await page.goto("/simulator");

  await expect(page.locator(".page-error")).toHaveCount(0);
  await expect(page.getByLabel("Application Date")).toBeEnabled();
  await expect(page.getByText("No accounts", { exact: true })).toBeVisible();
});

test("shows an options loader error while keeping the loaded date available", async ({ page }) => {
  await page.route(`**${API_PATH_PREFIX}/simulator/date`, (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill({ status: 400, json: { message: "Application Date was rejected" } });
    }

    return route.fulfill({ json: { currentDate: "2026-08-26" } });
  });
  await page.route(`**${API_PATH_PREFIX}/simulator/options`, (route) => route.fulfill({
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

  await page.getByLabel("Application Date").fill("08/27/2026");
  await expect(
    page.getByText("Status 400: Application Date was rejected", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Status 503: Simulator options are unavailable", { exact: true }),
  ).toBeVisible();
});
