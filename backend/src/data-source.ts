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


import path from "path";
let dbConfig: string | undefined = undefined;
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("sqlite://")) {
  // Use DATABASE_URL for production (non-sqlite)
  dbConfig = process.env.DATABASE_URL;
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("sqlite://")) {
  // Use sqlite file from DATABASE_URL, relative to backend dir
  dbConfig = path.resolve(__dirname, "..", process.env.DATABASE_URL.replace("sqlite://", ""));
} else if (process.env.DB_PATH) {
  dbConfig = path.resolve(__dirname, "..", process.env.DB_PATH);
} else {
  // Always use dev.db relative to backend dir
  dbConfig = path.resolve(__dirname, "..", "dev.db");
}



export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbConfig,
  synchronize: true, // Always sync to auto-create tables if missing
  logging: process.env.TYPEORM_LOGGING === "true" && !isProd,
  entities: [User, Task],
});