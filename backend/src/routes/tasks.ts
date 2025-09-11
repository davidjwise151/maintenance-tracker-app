import { Router, Request, Response } from "express";
import { authenticateJWT } from "../middleware/auth";
import { AppDataSource } from "../data-source";
import { Task } from "../entity/Task";
import { User } from "../entity/User";

const router = Router();


/**
 * GET /api/tasks/completed
 * Returns a paginated list of completed tasks, optionally filtered by category, date range, and status.
 * Query Parameters:
 *   - category: string (optional) — filter by task category
 *   - from: date string (optional) — filter tasks completed after this date
 *   - to: date string (optional) — filter tasks completed before this date
 *   - status: string (optional, default: "Done") — filter by task status
 *   - page: number (optional, default: 1) — page number for pagination
 *   - pageSize: number (optional, default: 20) — number of tasks per page
 *   - sort: "asc" | "desc" (optional, default: "desc") — sort order by completed date
 * Requires authentication (JWT).
 * Response:
 *   {
 *     tasks: [
 *       {
 *         id, title, category, completedAt, status,
 *         user: { id, email } | null
 *       }
 *     ],
 *     total: number,
 *     page: number,
 *     pageSize: number
 *   }
 */
router.get("/completed", authenticateJWT, async (req: Request, res: Response) => {
  // Extract query parameters for filtering and pagination
  const { category, from, to, status = "Done", page = 1, pageSize = 20, sort = "desc" } = req.query;
  const taskRepo = AppDataSource.getRepository(Task);

  // Build query for completed tasks, joining user info
  let query = taskRepo.createQueryBuilder("task")
    .leftJoinAndSelect("task.user", "user");

  // Apply status filter if provided
  if (status && status !== "") {
    query = query.where("task.status = :status", { status });
  }
  // Apply category filter if provided
  if (category) query = query.andWhere("task.category = :category", { category });
  // Filter by completed date range if provided
  if (from) query = query.andWhere("task.completedAt >= :from", { from });
  if (to) query = query.andWhere("task.completedAt <= :to", { to });

  // Sort results by completedAt date
  query = query.orderBy("task.completedAt", sort === "asc" ? "ASC" : "DESC");

  // Apply pagination
  const skip = (Number(page) - 1) * Number(pageSize);
  query = query.skip(skip).take(Number(pageSize));

  // Execute query and get results
  const [tasks, total] = await query.getManyAndCount();

  // Respond with filtered, paginated tasks
  res.json({
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      category: task.category,
      completedAt: task.completedAt,
      status: task.status,
      user: task.user ? { id: task.user.id, email: task.user.email } : null,
    })),
    total,
    page: Number(page),
    pageSize: Number(pageSize)
  });
});


/**
 * POST /api/tasks
 * Creates a new maintenance task for the authenticated user.
 * Request Body:
 *   - title: string (required) — task title
 *   - category: string (optional) — task category
 *   - status: string (required) — task status (e.g., "Pending", "In-Progress", "Done")
 * Requires authentication (JWT).
 * Response:
 *   The created task object.
 */
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  // Extract task details from request body
  const { title, category, status } = req.body;

  // Get userId from JWT payload (added by authenticateJWT middleware)
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  if (!userId) {
    // If no user ID, authentication failed
    return res.status(401).json({ error: "Unauthorized: No user ID in token." });
  }

  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);

  // Find the user by ID
  const user = await userRepo.findOneBy({ id: userId });
  if (!user) {
    // If user not found, return error
    return res.status(400).json({ error: "User not found." });
  }

  // If status is "Done", set completedAt timestamp
  const completedAt = status === "Done" ? Date.now() : undefined;

  // Create new task entity and save to database
  const task = taskRepo.create({
    title,
    category,
    status,
    completedAt,
    user,
  });
  await taskRepo.save(task);
  // Respond with the created task
  res.json(task);
});

export default router;