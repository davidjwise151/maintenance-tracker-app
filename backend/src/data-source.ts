import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Task } from "./entity/Task";
import dotenv from "dotenv";
dotenv.config();

/**
 * TypeORM DataSource configuration for the application.
 * - Uses SQLite for local development (dev.db).
 * - Uses environment variables for security and flexibility.
 * - Automatically synchronizes entity definitions with the database schema in development/testing only.
 * - Registers User and Task entities for ORM operations.
 * - Logging is disabled by default, can be enabled via env.
 */
const isProd = process.env.NODE_ENV === "production";

let dbConfig: string | undefined = undefined;
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("sqlite://")) {
  dbConfig = process.env.DATABASE_URL.replace("sqlite://", "");
} else if (process.env.DB_PATH) {
  dbConfig = process.env.DB_PATH;
} else {
  dbConfig = "dev.db";
}

console.log(`[DEBUG] DATABASE_URL: ${process.env.DATABASE_URL}`);
console.log(`[DEBUG] Resolved SQLite database path: ${dbConfig}`);

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbConfig,
  synchronize: isProd ? false : true, // Always sync in non-prod to auto-create tables
  logging: process.env.TYPEORM_LOGGING === "true" && !isProd,
  entities: [User, Task],
});