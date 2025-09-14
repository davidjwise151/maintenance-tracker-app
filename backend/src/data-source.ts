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
export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_PATH || "dev.db",
  synchronize: isProd ? false : process.env.TYPEORM_SYNC === "true" || true,
  logging: process.env.TYPEORM_LOGGING === "true" && !isProd,
  entities: [User, Task],
});