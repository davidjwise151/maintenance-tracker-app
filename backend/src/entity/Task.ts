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
     * Category of the task (e.g., Electrical, Plumbing, HVAC).
     */
    @Column({ nullable: true })
    category?: string;


  /**
   * Date when the task is due (timestamp).
   */
  @Column({ type: "bigint", nullable: true })
  dueDate?: number;

  /**
   * Date when the task was completed (timestamp).
   */
  @Column({ type: "bigint", nullable: true })
  completedAt?: number;

  /**
   * Reference to the user who owns this task.
   * Establishes a many-to-one relationship with the User entity.
   */
  @ManyToOne(() => User, (user) => user.tasks, { onDelete: "CASCADE" })
  user!: User;

  /**
   * Reference to the user assigned to this task (assignee).
   * Establishes a many-to-one relationship with the User entity.
   */
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  assignee?: User;
}