
import pool from "../src/config/database";
import { generateUsageCsv } from "../src/services/usage-csv.service";

async function main(): Promise<void> {
  try {
    await generateUsageCsv();
  } catch (error) {
    console.error("CSV generation failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
