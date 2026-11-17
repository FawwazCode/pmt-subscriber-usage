
import { Request, Response } from "express";
import pool from "../config/database";

export const getSubscribers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT
        subscriber_id,
        name,
        plan,
        activation_date
      FROM subscribers
      ORDER BY subscriber_id ASC`
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subscribers",
    });
  }
};
