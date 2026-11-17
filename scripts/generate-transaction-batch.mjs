import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compileFromFile } from "json-schema-to-typescript";

const schema = new URL("../../pricing-mock-server/schemas/transaction-batch-v1.json", import.meta.url);
const output = new URL("../app/generated/transactionProcessor/", import.meta.url);

await rm(output, { recursive: true, force: true });
await mkdir(new URL("models/", output), { recursive: true });
await writeFile(
  new URL("models/transactionBatch.ts", output),
  await compileFromFile(fileURLToPath(schema), { style: { printWidth: 100 } }),
);
await writeFile(new URL("models/index.ts", output), 'export * from "./transactionBatch";\n');
await copyFile(schema, new URL("transaction-batch-v1.json", output));
