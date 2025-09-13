import { Router, Request, Response } from "express";
import { authenticateJWT } from "../middleware/auth";
import { AppDataSource } from "../data-source";
import { Task } from "../entity/Task";
import { User } from "../entity/User";

const router = Router();

/**
 * DELETE /api/tasks/:id
 * Deletes a specific task owned by the authenticated user.
 * Requires authentication (JWT).
 * Returns: { success: true } or { error: string }
 */
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user ID in token.' });
  }
  const taskRepo = AppDataSource.getRepository(Task);
  const task = await taskRepo.findOne({ where: { id }, relations: ['user'] });
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  if (!task.user || task.user.id !== userId) {
    return res.status(403).json({ error: 'Forbidden: You do not own this task.' });
  }
  await taskRepo.remove(task);
  res.json({ success: true });
});

/**
 * PUT /api/tasks/:id/status
 * Updates the status of a specific task.
 * Request Body:
 *   - status: string (required) — new status value (Pending, In-Progress, Done)
 * Requires authentication (JWT).
 * Returns: The updated task object or error
 */
router.put("/:id/status", authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !["Pending", "In-Progress", "Done"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }
  const taskRepo = AppDataSource.getRepository(Task);
  const task = await taskRepo.findOneBy({ id });
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }
  task.status = status;
  // If status is set to Done, update completedAt; otherwise, clear it
  task.completedAt = status === "Done" ? Date.now() : undefined;
  await taskRepo.save(task);
  res.json({
    id: task.id,
    title: task.title,
    category: task.category,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    status: task.status,
    user: task.user,
  });
});


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
 * Returns: Paginated, filtered list of completed tasks
 */
router.get("/completed", authenticateJWT, async (req: Request, res: Response) => {
  // Extract query parameters for filtering and pagination
  const { category, from, to, status = "", page = 1, pageSize = 20, sort = "desc", dueFrom, dueTo } = req.query;
  const taskRepo = AppDataSource.getRepository(Task);

  // Build query for completed tasks, joining user info
  let query = taskRepo.createQueryBuilder("task")
    .leftJoinAndSelect("task.user", "user");

  // Apply filters
  if (status && status !== 'All') {
    query = query.andWhere("task.status = :status", { status });
  }
  if (category) query = query.andWhere("task.category = :category", { category });
  if (from) query = query.andWhere("task.completedAt >= :from", { from });
  if (to) query = query.andWhere("task.completedAt <= :to", { to });
  // Due date filtering: only apply if both are valid numbers
  const dueFromNum = dueFrom && !isNaN(Number(dueFrom)) ? Number(dueFrom) : undefined;
  const dueToNum = dueTo && !isNaN(Number(dueTo)) ? Number(dueTo) : undefined;
  if (dueFromNum !== undefined) query = query.andWhere("task.dueDate >= :dueFromNum", { dueFromNum });
  if (dueToNum !== undefined) query = query.andWhere("task.dueDate <= :dueToNum", { dueToNum });

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
      status: task.status,
  dueDate: task.dueDate,
      completedAt: task.completedAt,
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
 * Returns: The created task object or error
 */
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { title, category, status, dueDate } = req.body;

  // Get userId from JWT payload (added by authenticateJWT middleware)
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID in token." });
  }

  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);

  // Find the user by ID
  const user = await userRepo.findOneBy({ id: userId });
  if (!user) {
    return res.status(400).json({ error: "User not found." });
  }

  // If status is "Done", set completedAt timestamp
  const completedAt = status === "Done" ? Date.now() : undefined;

  // Create new task entity and save to database
  const task = taskRepo.create({
    title,
    category,
    status,
    dueDate,
    completedAt,
    user,
  });
  const savedTask = await taskRepo.findOneBy({ id: task.id });
  await taskRepo.save(task);
  res.json({
    id: task.id,
    title: task.title,
    category: task.category,
    status: task.status,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    user: task.user,
  });
});

export default router;