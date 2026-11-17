
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

const exportDir = path.resolve(process.cwd(), "exports");

const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

async function cleanupOldCsv(): Promise<void> {
  console.log("Starting old CSV cleanup...");

  try {
    const files = await readdir(exportDir);
    const now = Date.now();

    let deletedCount = 0;
    let retainedCount = 0;

    for (const file of files) {
      if (!file.endsWith(".csv")) {
        continue;
      }

      const filePath = path.join(exportDir, file);
      const fileStats = await stat(filePath);

      if (!fileStats.isFile()) {
        continue;
      }

      const fileAge = now - fileStats.mtimeMs;

      if (fileAge > MAX_AGE_MS) {
        await unlink(filePath);
        deletedCount++;

        console.log(`[Deleted] ${file}`);
      } else {
        retainedCount++;
      }
    }

    console.log("CSV cleanup completed.");
    console.log(`Deleted files: ${deletedCount}`);
    console.log(`Retained files: ${retainedCount}`);
  } catch (error) {
    console.error("CSV cleanup failed:", error);
    process.exitCode = 1;
  }
}

void cleanupOldCsv();
