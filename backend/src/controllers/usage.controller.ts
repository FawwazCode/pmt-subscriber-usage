
import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";

// GET all usage records or filter by subscriberId
export const getUsageRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriberId = req.query.subscriberId;

    let query = `
      SELECT
        id,
        subscriber_id AS subscriberId,
        call_minutes AS callMinutes,
        sms_count AS smsCount,
        data_usage_mb AS dataUsageMB,
        snapshot_at AS timestamp
      FROM usage_records
    `;

    const params: string[] = [];

    if (subscriberId !== undefined) {
      if (
        typeof subscriberId !== "string" ||
        subscriberId.trim() === ""
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid subscriberId parameter",
        });
        return;
      }

      query += " WHERE subscriber_id = ?";
      params.push(subscriberId.trim());
    }

    query += " ORDER BY snapshot_at DESC, id DESC";

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching usage records:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch usage records",
    });
  }
};

// POST a new usage record
export const createUsageRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      subscriberId,
      callMinutes,
      smsCount,
      dataUsageMB,
    } = req.body ?? {};

    // Validate subscriberId
    if (
      typeof subscriberId !== "string" ||
      subscriberId.trim() === ""
    ) {
      res.status(400).json({
        success: false,
        message: "subscriberId must be a non-empty string",
      });
      return;
    }

    // Validate usage values
    const usageValues = [
      { field: "callMinutes", value: callMinutes },
      { field: "smsCount", value: smsCount },
      { field: "dataUsageMB", value: dataUsageMB },
    ];

    for (const item of usageValues) {
      if (
        typeof item.value !== "number" ||
        !Number.isSafeInteger(item.value) ||
        item.value < 0
      ) {
        res.status(400).json({
          success: false,
          message: `${item.field} must be a non-negative safe integer`,
        });
        return;
      }
    }

    const normalizedSubscriberId = subscriberId.trim();

    // Check whether the subscriber exists
    const [subscriberRows] = await pool.execute<RowDataPacket[]>(
      `SELECT subscriber_id
       FROM subscribers
       WHERE subscriber_id = ?`,
      [normalizedSubscriberId]
    );

    if (subscriberRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
      return;
    }

    // Save usage record using MySQL server's local time (WIB)
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO usage_records (
        subscriber_id,
        call_minutes,
        sms_count,
        data_usage_mb,
        snapshot_at
      ) VALUES (?, ?, ?, ?, NOW())`,
      [
        normalizedSubscriberId,
        callMinutes,
        smsCount,
        dataUsageMB,
      ]
    );

    // Retrieve the newly created record
    const [usageRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        id,
        subscriber_id AS subscriberId,
        call_minutes AS callMinutes,
        sms_count AS smsCount,
        data_usage_mb AS dataUsageMB,
        snapshot_at AS timestamp
      FROM usage_records
      WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Usage record created successfully",
      data: usageRows[0],
    });
  } catch (error) {
    console.error("Error creating usage record:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create usage record",
    });
  }
};
