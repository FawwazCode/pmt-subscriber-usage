
import "dotenv/config";
import mysql from "mysql2/promise";

function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

const pool = mysql.createPool({
  host: getRequiredEnv("DB_HOST"),
  port: Number(process.env.DB_PORT ?? 3306),
  user: getRequiredEnv("DB_USER"),
  password: getRequiredEnv("DB_PASSWORD"),
  database: getRequiredEnv("DB_NAME"),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  dateStrings: true,
});

export default pool;
