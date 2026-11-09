import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const assetsDirectory = fileURLToPath(new URL("../build/client/assets/", import.meta.url));
let fileCount = 0;
let originalBytes = 0;
let compressedBytes = 0;

async function compressAssets(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await compressAssets(path);
    } else if (entry.isFile() && /\.(?:js|css)$/.test(entry.name)) {
      const original = await readFile(path);
      const compressed = gzipSync(original, { level: 9 });
      if (compressed.length >= original.length) continue;
      await writeFile(path + ".gz", compressed);
      fileCount++;
      originalBytes += original.length;
      compressedBytes += compressed.length;
    }
  }
}

await compressAssets(assetsDirectory);
console.log(
  `Gzip: ${fileCount} assets, ${(originalBytes / 1024 / 1024).toFixed(2)} MiB -> ${(compressedBytes / 1024 / 1024).toFixed(2)} MiB`,
);
