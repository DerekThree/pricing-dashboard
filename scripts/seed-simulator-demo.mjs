import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "@playwright/test";

const demoAccounts = [
  {
    productCode: "CHK",
    branchCode: "BR101",
    attributes: { AGE: 38, BAL: 8450.75, OPENED: "05/15/2020", TENURE: 6 },
    transactionAmounts: { FOREIGNTXN: 175.25 },
  },
  {
    productCode: "SAV",
    branchCode: "BR200",
    attributes: { AGE: 42, BAL: 24450.5, OPENED: "03/12/2019", TENURE: 7 },
    transactionAmounts: { FOREIGNTXN: 240 },
  },
  {
    productCode: "AUTO",
    branchCode: "BR100",
    attributes: {
      AGE: 34,
      AUTOPAY: true,
      INCOME: 82000,
      LTV: 0.72,
      STATE: "TX",
      TERM: 60,
    },
    transactionAmounts: { ORIGIN: 35000 },
  },
  {
    productCode: "CD12",
    branchCode: "BR300",
    attributes: { AGE: 62, BAL: 125000, OPENED: "03/01/2024" },
    transactionAmounts: { EARLYWDRAW: 5000 },
  },
  {
    productCode: "CHKPLUS",
    branchCode: "BR201",
    attributes: { AGE: 51, BAL: 48500, OPENED: "09/20/2017", TENURE: 9 },
    transactionAmounts: { FOREIGNTXN: 86.5 },
  },
  {
    productCode: "MMSAV",
    branchCode: "BR301",
    attributes: { AGE: 44, BAL: 78250.25, OPENED: "01/10/2021", TENURE: 5 },
    transactionAmounts: { FOREIGNTXN: 320 },
  },
];

function findChrome() {
  const programFiles = process.env.PROGRAMFILES;
  const programFilesX86 = process.env["PROGRAMFILES(X86)"];
  const localAppData = process.env.LOCALAPPDATA;
  const chromePath = ["Google", "Chrome", "Application", "chrome.exe"];
  const candidates = [programFiles, programFilesX86, localAppData]
    .filter(Boolean)
    .map((directory) => join(directory, ...chromePath));
  const chrome = candidates.find(existsSync);

  if (!chrome) {
    throw new Error("Google Chrome was not found in a standard Windows installation path.");
  }

  return chrome;
}

async function connect(port) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      return await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error("Chrome did not start its debugging connection.");
}

async function connectToExistingChrome(port) {
  try {
    return await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 1_000 });
  } catch {
    return null;
  }
}

async function selectOption(page, label, option) {
  await page.getByLabel(label).click();
  await page.getByText(`${option.code} - ${option.name}`, { exact: true }).click();
}

async function selectBooleanOption(page, label, value) {
  await page.getByLabel(label).click();
  await page.getByRole("option", { name: value ? "True" : "False" }).click();
}

async function loadSimulatorOptions() {
  const response = await fetch("http://localhost:8080/simulator/options");
  if (!response.ok) {
    throw new Error(`Simulator options request failed with status ${response.status}.`);
  }

  return response.json();
}

function optionByCode(options, category, code) {
  const option = options[category].find((candidate) => candidate.code === code);
  if (!option) {
    throw new Error(`Simulator ${category} does not contain ${code}.`);
  }

  return option;
}

const profile = join(tmpdir(), "pricing-dashboard-simulator-demo-profile");
const chromePort = 55041;
mkdirSync(profile, { recursive: true });
const options = await loadSimulatorOptions();
let browser = await connectToExistingChrome(chromePort);

if (!browser) {
  spawn(findChrome(), [
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profile}`,
    "--new-window",
    "http://localhost:5173/simulator",
  ], { detached: true, stdio: "ignore" }).unref();
  browser = await connect(chromePort);
}

const context = browser.contexts()[0];
const page = context.pages().find((currentPage) =>
  currentPage.url().includes("localhost:5173")) ?? context.pages().at(-1);
if (!page) {
  throw new Error("Chrome opened without a Simulator page.");
}

await page.waitForLoadState("domcontentloaded");
await page.goto("http://localhost:5173/simulator");

const accounts = page.locator(".selection-list").filter({ hasText: "Accounts" });
const fees = page.locator(".selection-list").filter({ hasText: "Fees" });

for (const account of demoAccounts) {
  const product = optionByCode(options, "products", account.productCode);
  await accounts.getByRole("button", { name: "Add" }).click();
  await selectOption(page, "Product", product);
  await selectOption(page, "Branch", optionByCode(options, "branches", account.branchCode));

  for (const [code, value] of Object.entries(account.attributes)) {
    const attribute = optionByCode(options, "attributes", code);
    if (attribute.type === "BOOLEAN") {
      await selectBooleanOption(page, attribute.name, value);
    } else {
      await page.getByLabel(attribute.name).fill(String(value));
    }
  }

  for (const fee of options.fees.filter(({ productTypes }) => productTypes.includes(product.type))) {
    await fees.getByRole("button", { name: "Add" }).click();
    await selectOption(page, "Fee Name", fee);

    if (fee.type === "PERCENT") {
      await page.getByLabel("Transaction Amount").fill(String(account.transactionAmounts[fee.code]));
    }
  }
}

console.log("Created six distinct Simulator account drafts. Chrome remains open for your demo.");
process.exit(0);
