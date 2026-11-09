import { expect, type Locator, test } from "@playwright/test";

import type { SimulatorOptions } from "../app/generated/backend/models";
import type { BatchRequest } from "../app/generated/accountProcessor/models";

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

  await page.route("**/api/v1/simulator/date", async (route) => {
    if (route.request().method() === "PUT") {
      currentDate = route.request().postDataJSON().currentDate;
    }

    await route.fulfill({ json: { currentDate } });
  });
  await page.route("**/api/v1/simulator/options", async (route) => {
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
  await page.route("**/api/v1/simulator/date", (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route("**/api/v1/simulator/options", (route) => route.fulfill({
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
  await page.route("**/api/v1/simulator/date", (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route("**/api/v1/simulator/options", (route) => route.fulfill({
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
  await page.route("**/api/v1/simulator/date", (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route("**/api/v1/simulator/options", (route) => route.fulfill({
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
  await page.route("**/api/v1/simulator/date", (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route("**/api/v1/simulator/options", (route) => route.fulfill({
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

for (const configuration of ["native", "runtime", "same-origin"] as const) {
  test(`routes every Account and locks acceptance until Reset (${configuration})`, async ({
    page,
    baseURL,
  }) => {
    const appOrigin = new URL(baseURL!).origin;
    const backendOrigin = configuration === "native"
      ? "http://127.0.0.1:18080"
      : configuration === "runtime" ? "http://127.0.0.1:19080" : appOrigin;
    const processorOrigin = configuration === "native"
      ? "http://127.0.0.1:18081"
      : configuration === "runtime" ? "http://127.0.0.1:19081" : appOrigin;
    if (configuration !== "native") {
      await page.addInitScript((configuration) => {
        window.__APP_CONFIG__ = configuration === "runtime"
          ? {
            BACKEND_API_URL: "http://127.0.0.1:19080/",
            ACCOUNT_PROCESSOR_API_URL: "http://127.0.0.1:19081/",
          }
          : { BACKEND_API_URL: "", ACCOUNT_PROCESSOR_API_URL: "" };
      }, configuration);
    }
    const backendRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/simulator/")) {
        backendRequests.push(request.url());
      }
    });
    let acceptSubmission!: () => void;
    const acceptanceReady = new Promise<void>((resolve) => { acceptSubmission = resolve; });
    let currentDate = "2026-08-26";
    const requests: BatchRequest[] = [];

    await page.route("**/api/v1/branches", (route) => {
      expect(route.request().url()).toBe(`${backendOrigin}/api/v1/branches`);
      return route.fulfill({ json: [] });
    });
    await page.route("**/api/v1/simulator/date", async (route) => {
      if (route.request().method() === "PUT") {
        currentDate = route.request().postDataJSON().currentDate;
      }

      await route.fulfill({ json: { currentDate } });
    });
    await page.route("**/api/v1/simulator/options", (route) => route.fulfill({
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
    await page.route("**/api/v1/mock/acc/batch", async (route) => {
      expect(route.request().url()).toBe(`${processorOrigin}/api/v1/mock/acc/batch`);
      expect(route.request().method()).toBe("POST");
      requests.push(route.request().postDataJSON() as BatchRequest);
      await acceptanceReady;
      await route.fulfill({
        status: 202,
        json: { batchId: requests.at(-1)!.batchId, message: "Pricing Batch accepted." },
      });
    });

    await page.goto("/branches");
    await expect(page.getByRole("heading", { name: "Branches", exact: true })).toBeVisible();
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
    await page.getByLabel("Application Date").fill("08/27/2026");
    await expect.poll(() => currentDate).toBe("2026-08-27");

    await page.getByRole("button", { name: "Send" }).click();
    const reset = page.getByRole("button", { name: "Reset" });
    await expect(reset).toBeVisible();
    await expect(reset).toBeDisabled();
    await expect(page.getByRole("button", { name: "Send" })).toHaveCount(0);
    await expect(page.getByLabel("Product")).toBeDisabled();
    await expect(page.getByLabel("Application Date")).toBeDisabled();
    await expect.poll(() => requests.length).toBe(1);
    expect(backendRequests).toEqual([
      `${backendOrigin}/api/v1/simulator/date`,
      `${backendOrigin}/api/v1/simulator/options`,
      `${backendOrigin}/api/v1/simulator/date`,
    ]);
    acceptSubmission();
    await expect(reset).toBeEnabled();

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
          pricingDate: "2026-08-27",
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
          pricingDate: "2026-08-27",
          attributes: [{ code: "TIER", value: "Silver" }],
          fees: [{ feeRequestId: 1, code: "WIRE", transactionAmount: 250.5 }],
        },
      ],
    });
    await expect(page.getByRole("button", { name: "Send" })).toHaveCount(0);
    await expect(page.getByLabel("Application Date")).toBeDisabled();
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
    await expect(page.locator(".simulator-response-value")).toHaveText([
      firstBatchId,
      "Pricing Batch accepted.",
    ]);
    await expect(page.getByText("Account Status", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Pricing Plan Code", { exact: true })).toHaveCount(0);
    await expect(page.locator(".simulator-fee-response")).toHaveCount(0);
    await accountRow(accounts, "10000001").click();
    await expect(page.locator(".simulator-response-value")).toHaveText([
      firstBatchId,
      "Pricing Batch accepted.",
    ]);
    await accountRow(accounts, "10000006").click();

    await reset.click();
    await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
    await expect(page.getByLabel("Product")).toBeEnabled();
    await expect(page.getByLabel("Account Tier")).toHaveValue("Silver");
    await expect(page.getByLabel("Application Date")).toBeEnabled();
    await expect(page.getByLabel("Transaction Amount")).toHaveValue("250.5");
    await expect(accounts.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(feeRequests.getByRole("button", { name: "Add" })).toBeVisible();

    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("button", { name: "Reset" })).toBeEnabled();
    expect(requests).toHaveLength(2);
    expect(requests[1].batchId).not.toBe(firstBatchId);
  });

}

test("retries corrected Batch drafts with the same ID after HTTP and transport failures", async ({
  page,
}) => {
  const requests: BatchRequest[] = [];
  const failures = [
    { status: 400, code: "INVALID_BATCH", message: "Invalid Batch" },
    { status: 409, code: "SUBMISSION_CONFLICT", message: "Submission conflict" },
    { status: 503, code: "ACCOUNT_STORE_UNAVAILABLE", message: "Batch unavailable" },
    { transport: "failed" },
    { transport: "timedout" },
  ] as const;

  await page.route("**/api/v1/simulator/date", (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route("**/api/v1/simulator/options", (route) => route.fulfill({
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
      attributes: [{
        id: 4,
        code: "TIER",
        name: "Account Tier",
        type: "TEXT",
        productTypes: ["DEPOSIT"],
      }],
    }),
  }));
  await page.route("**/api/v1/mock/acc/batch", (route) => {
    const failure = failures[requests.length];
    requests.push(route.request().postDataJSON() as BatchRequest);
    if (!failure) {
      if (requests.length === failures.length + 1) {
        return route.fulfill({
          status: 409,
          json: {
            code: "BATCH_ALREADY_ACCEPTED",
            message: "This Pricing Batch has already been accepted",
          },
        });
      }
      return route.fulfill({
        status: 202,
        json: { batchId: requests.at(-1)!.batchId, message: "Pricing Batch accepted." },
      });
    }
    return "transport" in failure
      ? route.abort(failure.transport)
      : route.fulfill({ status: failure.status, json: failure });
  });

  await page.goto("/simulator");
  const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
  const feeRequests = page.locator(".selection-list").filter({ hasText: "Fees" });
  await addSingleDraft(accounts);
  await page.getByLabel("Product").click();
  await page.getByText("PROD0001 - Checking", { exact: true }).click();
  await page.getByLabel("Branch").click();
  await page.getByText("BRANCH0001 - Main Branch", { exact: true }).click();
  await page.getByLabel("Account Tier").fill("Gold");
  await feeRequests.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Fee Name").click();
  await page.getByText("MONTHLY - Monthly Fee", { exact: true }).click();

  const send = page.getByRole("button", { name: "Send" });
  for (const [index, failure] of failures.entries()) {
    await send.click();
    await expect(page.locator(".page-error")).toHaveText("transport" in failure
      ? "Status 503: The app could not complete the backend request. Please try again later."
      : `Status ${failure.status}: ${failure.message}`);
    await expect(send).toBeEnabled();
    await expect(page.getByRole("button", { name: "Reset" })).toHaveCount(0);
    await expect(page.getByLabel("Application Date")).toBeEnabled();
    await expect(page.getByLabel("Product")).toBeEnabled();
    await expect(page.getByLabel("Branch")).toBeEnabled();
    await expect(page.getByLabel("Fee Name")).toBeEnabled();
    await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
    await expect(page.locator(".simulator-fee-response")).toHaveCount(0);
    await expect(accounts.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(feeRequests.getByRole("button", { name: "Add" })).toBeVisible();
    expect(requests[index].batchId).toBe(requests[0].batchId);
    expect(requests[index].accounts[0].attributes).toEqual([
      { code: "TIER", value: index === 0 ? "Gold" : `Corrected ${index - 1}` },
    ]);
    await page.getByLabel("Account Tier").fill(`Corrected ${index}`);
  }
  await send.click();
  await expect(page.locator(".page-error")).toHaveText(
    "Status 409: This Pricing Batch has already been accepted",
  );
  await expect(page.getByRole("button", { name: "Send" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reset" })).toBeEnabled();
  await expect(page.getByLabel("Application Date")).toBeDisabled();
  await expect(page.getByLabel("Product")).toBeDisabled();
  await expect(page.getByLabel("Branch")).toBeDisabled();
  await expect(page.getByLabel("Account Tier")).toBeDisabled();
  await expect(page.getByLabel("Fee Name")).toBeDisabled();
  await expect(accounts.getByRole("button", { name: "Add" })).toHaveCount(0);
  await expect(accounts.getByRole("button", { name: "X" })).toHaveCount(0);
  await expect(feeRequests.getByRole("button", { name: "Add" })).toHaveCount(0);
  await expect(feeRequests.getByRole("button", { name: "X" })).toHaveCount(0);
  await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
  await expect(page.locator(".simulator-fee-response")).toHaveCount(0);
  expect(requests.at(-1)!.batchId).toBe(requests[0].batchId);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator(".page-error")).toHaveCount(0);
  await expect(page.getByLabel("Product")).toBeEnabled();
  await expect(page.locator(".simulator-response-value")).toHaveText(["", ""]);
  const finalRequest = page.waitForRequest("**/api/v1/mock/acc/batch");
  await send.click();
  const finalBatch = (await finalRequest).postDataJSON() as BatchRequest;
  await expect(page.locator(".simulator-response-value")).toHaveText([
    finalBatch.batchId,
    "Pricing Batch accepted.",
  ]);
  expect(finalBatch.batchId).not.toBe(requests[0].batchId);
});

test("accepts empty Simulator option categories", async ({ page }) => {
  await page.route("**/api/v1/simulator/date", (route) => route.fulfill({
    json: { currentDate: "2026-08-26" },
  }));
  await page.route("**/api/v1/simulator/options", (route) => route.fulfill({
    json: { products: [], branches: [], fees: [], attributes: [] },
  }));

  await page.goto("/simulator");

  await expect(page.locator(".page-error")).toHaveCount(0);
  await expect(page.getByLabel("Application Date")).toBeEnabled();
  await expect(page.getByText("No accounts", { exact: true })).toBeVisible();
});

test("shows an options loader error while keeping the loaded date available", async ({ page }) => {
  await page.route("**/api/v1/simulator/date", (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill({ status: 400, json: { message: "Application Date was rejected" } });
    }

    return route.fulfill({ json: { currentDate: "2026-08-26" } });
  });
  await page.route("**/api/v1/simulator/options", (route) => route.fulfill({
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
