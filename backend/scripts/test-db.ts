
import pool from "../src/config/database";

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();

    console.log("MySQL connection successful!");

    const [rows] = await connection.query(`
      SELECT
        DATABASE() AS databaseName,
        (SELECT COUNT(*) FROM subscribers) AS totalSubscribers,
        (SELECT COUNT(*) FROM usage_records) AS totalUsageRecords
    `);

    console.log("Database verification:", rows);

    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
