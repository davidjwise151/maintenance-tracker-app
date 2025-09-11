import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Task } from "./entity/Task";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "dev.db",
  synchronize: true,
  logging: false,
  entities: [User, Task],
});