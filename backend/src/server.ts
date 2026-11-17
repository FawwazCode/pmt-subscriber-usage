
import "dotenv/config";

import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import subscriberRoutes from "./routes/subscriber.routes";
import usageRoutes from "./routes/usage.routes";
import pool from "./config/database";
import {
  startUsageCsvScheduler,
  stopUsageCsvScheduler,
} from "./jobs/usage-csv.scheduler";

const app = express();

const PORT = Number(process.env.PORT ?? 3000);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/usage", usageRoutes);

// Health Check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PMT Subscriber Usage API is running",
    timestamp: new Date().toISOString(),
  });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("[Error] Request failed:", error);

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400 &&
    "body" in error
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
    return;
  }

  const status =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : undefined;
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? error.statusCode
      : undefined;
  const responseStatus =
    typeof status === "number" && Number.isInteger(status) && status >= 400 && status <= 599
      ? status
      : typeof statusCode === "number" &&
          Number.isInteger(statusCode) &&
          statusCode >= 400 &&
          statusCode <= 599
        ? statusCode
        : 500;

  res.status(responseStatus).json({
    success: false,
    message: "Internal server error",
  });
};

app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV ?? "development"}`);

  startUsageCsvScheduler();
});

// Graceful Shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log("[Shutdown] Shutdown is already in progress.");
    return;
  }

  isShuttingDown = true;

  console.log(`[Shutdown] Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop accepting new HTTP connections
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    console.log("[Shutdown] HTTP server closed.");

    // Stop scheduler and wait for active CSV generation
    await stopUsageCsvScheduler();

    // Close MySQL connection pool
    await pool.end();

    console.log("[Shutdown] MySQL connection pool closed.");
    console.log("[Shutdown] Application shutdown completed.");
  } catch (error) {
    console.error("[Shutdown] Error during shutdown:", error);
    process.exitCode = 1;
  }
}

// Handle termination signals
process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
