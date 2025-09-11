import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Task } from "./entity/Task";

/**
 * TypeORM DataSource configuration for the application.
 * - Uses SQLite for local development (dev.db).
 * - Automatically synchronizes entity definitions with the database schema.
 * - Registers User and Task entities for ORM operations.
 * - Logging is disabled for cleaner output.
 */
export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "dev.db",
  synchronize: true,
  logging: false,
  entities: [User, Task],
});