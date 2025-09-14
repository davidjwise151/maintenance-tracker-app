import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Task } from "./Task";

/**
 * User entity representing an application user.
 * Stores unique email and hashed password for authentication.
 * Each user can have multiple associated tasks.
 * Uses UUID for unique identification.
 */
@Entity()
export class User {
  /**
   * Unique identifier for the user (UUID).
   */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * User's email address (must be unique).
   */
  @Column({ unique: true })
  email!: string;


  /**
   * Hashed password for authentication.
   */
  @Column()
  password!: string;

  /**
   * Role of the user (e.g., 'admin', 'manager', 'user').
   * Used for permission checks and access control.
   */
  @Column({ default: 'user' })
  role!: string;

  /**
   * List of tasks associated with this user.
   * Establishes a one-to-many relationship with the Task entity.
   */
  @OneToMany(() => Task, (task) => task.user)
  tasks!: Task[];
}