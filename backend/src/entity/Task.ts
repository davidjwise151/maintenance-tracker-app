import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";

/**
 * Task entity representing a maintenance task in the system.
 * Each task is associated with a user (owner).
 * Uses UUID for unique identification.
 */
@Entity()
export class Task {
  /**
   * Unique identifier for the task (UUID).
   */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Title or description of the task.
   */
  @Column()
  title!: string;

  /**
   * Status of the task (e.g., Pending, In-Progress, Done).
   */
  @Column()
  status!: string;

  /**
   * Reference to the user who owns this task.
   * Establishes a many-to-one relationship with the User entity.
   */
  @ManyToOne(() => User, (user) => user.tasks)
  user!: User;
}