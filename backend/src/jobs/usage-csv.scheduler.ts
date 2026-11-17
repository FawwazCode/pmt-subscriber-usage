
import cron from "node-cron";
import { generateUsageCsv } from "../services/usage-csv.service";

let schedulerTask: ReturnType<typeof cron.schedule> | null = null;
let activeGeneration: Promise<void> | null = null;

async function runCsvGeneration(): Promise<void> {
  try {
    console.log("[CSV Scheduler] Starting daily CSV generation...");

    const filePath = await generateUsageCsv();

    console.log("[CSV Scheduler] CSV generated successfully.");
    console.log(`[CSV Scheduler] File: ${filePath}`);
  } catch (error) {
    console.error(
      "[CSV Scheduler] Failed to generate CSV:",
      error
    );
  }
}

export function startUsageCsvScheduler(): void {
  if (schedulerTask) {
    console.log("[CSV Scheduler] Scheduler is already running.");
    return;
  }

  schedulerTask = cron.schedule(
    "0 8,12,15 * * *",
    async () => {
      if (activeGeneration) {
        console.log(
          "[CSV Scheduler] Previous generation is still running. Skipping."
        );
        return;
      }

      const generation = runCsvGeneration();
      activeGeneration = generation;

      try {
        await generation;
      } finally {
        if (activeGeneration === generation) {
          activeGeneration = null;
        }
      }
    },
    {
      timezone: "Asia/Jakarta",
      noOverlap: true,
    }
  );

  console.log(
    "[CSV Scheduler] Scheduled daily at 08:00, 12:00, 15:00 Asia/Jakarta."
  );
}

export async function stopUsageCsvScheduler(): Promise<void> {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;

    console.log("[CSV Scheduler] Scheduler stopped.");
  }

  if (activeGeneration) {
    console.log(
      "[CSV Scheduler] Waiting for active CSV generation to finish..."
    );

    await activeGeneration;
  }

  console.log("[CSV Scheduler] Shutdown completed.");
}
