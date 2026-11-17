
import pool from "../config/database";
import type { RowDataPacket } from "mysql2";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface UsageCsvRow extends RowDataPacket {
  subscriber_id: string;
  name: string;
  plan: string;
  call_minutes: number;
  sms_count: number;
  data_usage_mb: number | string;
  snapshot_at: string;
}

const CSV_HEADERS = [
  "subscriber_id",
  "name",
  "plan",
  "call_minutes",
  "sms_count",
  "data_usage_mb",
  "snapshot_at",
] as const;

function escapeCsv(value: unknown): string {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export async function generateUsageCsv(): Promise<string> {
  console.log("Starting CSV generation...");

  const [rows] = await pool.query<UsageCsvRow[]>(`
    SELECT
      s.subscriber_id,
      s.name,
      s.plan,
      u.call_minutes,
      u.sms_count,
      u.data_usage_mb,
      u.snapshot_at
    FROM subscribers s
    INNER JOIN usage_records u
      ON s.subscriber_id = u.subscriber_id
    ORDER BY
      u.snapshot_at ASC,
      s.subscriber_id ASC,
      u.id ASC
  `);

  const csvContent = [
    CSV_HEADERS.map(escapeCsv).join(","),
    ...rows.map((row) =>
      CSV_HEADERS.map((header) => escapeCsv(row[header])).join(",")
    ),
  ].join("\n");

  const exportDir = path.resolve(process.cwd(), "exports");

  await mkdir(exportDir, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const fileName = `usage-snapshot-${timestamp}.csv`;
  const filePath = path.join(exportDir, fileName);

  await writeFile(filePath, `\uFEFF${csvContent}`, "utf8");

  console.log("CSV generation completed!");
  console.log(`Total records: ${rows.length}`);
  console.log(`File saved: ${filePath}`);

  return filePath;
}
