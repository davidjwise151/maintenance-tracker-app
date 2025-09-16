
/**
 * GET /api/tasks/:id
 * Returns a single task by ID if the authenticated user is the owner, assignee, or admin.
 * Requires authentication (JWT).
 * Returns: The task object or error
 */

/**
 * GET /api/tasks/:id
 * Returns a single task by ID if the authenticated user is the owner, assignee, or admin.
 * Requires authentication (JWT).
 * Returns: The task object or error
 */
// Helper to compute isOverdue for a task (always false for Done)
function computeIsOverdue(task: any): boolean {
  if (task.status === "Done") return false;
  if (task.dueDate && ["Pending", "Accepted", "In-Progress"].includes(task.status)) {
    return new Date(task.dueDate).getTime() < Date.now();
  }
  return false;
}

import { Router, Request, Response } from "express";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import { AppDataSource } from "../data-source";
import { Task } from "../entity/Task";
import { User } from "../entity/User";
import { LessThan, MoreThan, Between, IsNull } from "typeorm";

const router = Router();

/**
// GET /api/users
// Returns all users (id, email) for assignment dropdowns.
// Only admin users can list all users
router.get('/api/users', authenticateJWT, authorizeRoles('admin'), async (req: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ select: ['id', 'email'] });
  res.json({ users });
});
});

/**
 * PUT /api/tasks/:id/assign
 * Assigns a user to a task (or changes assignee).
 * Request Body: { assigneeId: string }
 * Only the owner can assign/change assignee.
 */
// Only admin or task owner can assign/change assignee
router.put('/:id/assign', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { assigneeId } = req.body;
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  const userRole = jwtUser && jwtUser.role;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user ID in token.' });
  }
  // Only admins can assign or reassign tasks
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only admins can assign or reassign tasks.' });
  }
  if (!assigneeId) {
    return res.status(400).json({ error: 'Missing assigneeId in request body.' });
  }
  const taskRepo = AppDataSource.getRepository(Task);
  const userRepo = AppDataSource.getRepository(User);
  const task = await taskRepo.findOne({ where: { id }, relations: ['user', 'assignee'] });
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  const assignee = await userRepo.findOneBy({ id: assigneeId });
  if (!assignee) {
    return res.status(400).json({ error: 'Assignee not found.' });
  }
  if (task.assignee && task.assignee.id === assignee.id) {
    return res.status(400).json({ error: 'User is already assigned to this task.' });
  }
  task.assignee = assignee;
  task.status = 'Pending';
  await taskRepo.save(task);
  // Compute isOverdue for single task response
  return res.status(200).json({
    id: task.id,
    title: task.title,
    category: task.category,
    status: task.status,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    user: task.user ? { id: task.user.id, email: task.user.email } : null,
    assignee: task.assignee ? { id: task.assignee.id, email: task.assignee.email } : null,
    isOverdue: computeIsOverdue(task),
  });
});

/**
 * PUT /api/tasks/:id/accept
 * Assignee accepts the task (status: Accepted).
 * Only the assignee can accept.
 */
router.put('/:id/accept', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user ID in token.' });
  }
  const taskRepo = AppDataSource.getRepository(Task);
  const task = await taskRepo.findOne({ where: { id }, relations: ['assignee', 'user'] });
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  if (!task.assignee || task.assignee.id !== userId) {
    return res.status(403).json({ error: 'Forbidden: Only the assignee can accept.' });
  }
  if (task.status !== 'Pending') {
    return res.status(400).json({ error: 'Task is not pending.' });
  }
  task.status = 'Accepted';
  await taskRepo.save(task);
  // Compute isOverdue for single task response
  res.json({
    id: task.id,
    title: task.title,
    category: task.category,
    status: task.status,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    user: task.user ? { id: task.user.id, email: task.user.email } : null,
    assignee: task.assignee ? { id: task.assignee.id, email: task.assignee.email } : null,
    isOverdue: computeIsOverdue(task),
  });
});

// GET /api/tasks/upcoming
// Returns upcoming (due in next 14 days) and late (past due) tasks for the authenticated user
router.get("/upcoming", authenticateJWT, async (req: Request, res: Response) => {
  const taskRepo = AppDataSource.getRepository(Task);
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID in token." });
  }
  const now = Date.now();
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  // Upcoming: dueDate between now and now+2weeks, not completed
  const upcomingRaw = await taskRepo.find({
    where: {
      user: { id: userId },
      dueDate: Between(now, now + twoWeeksMs),
      completedAt: IsNull(),
    },
    order: { dueDate: "ASC" },
  });
  const lateRaw = await taskRepo.find({
    where: {
      user: { id: userId },
      dueDate: LessThan(now),
      completedAt: IsNull(),
    },
    order: { dueDate: "ASC" },
  });
  const addIsOverdue = (task: any) => {
    return {
      ...task,
      isOverdue: computeIsOverdue(task),
    };
  };
  const upcoming = upcomingRaw.map(addIsOverdue);
  const late = lateRaw.map(addIsOverdue);
  res.json({ upcoming, late });
});

/**
 * DELETE /api/tasks/:id
 * Deletes a specific task owned by the authenticated user.
 * Requires authentication (JWT).
 * Returns: { success: true } or { error: string }
 */
// Only admin users can delete any task
// Only admin or task owner can delete
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  const userRole = jwtUser && jwtUser.role;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user ID in token.' });
  }
  // Reject malformed/unknown roles
  if (userRole !== 'admin' && userRole !== 'user') {
    return res.status(403).json({ error: 'Forbidden: Unknown or malformed user role.' });
  }
  const taskRepo = AppDataSource.getRepository(Task);
  const task = await taskRepo.findOne({ where: { id }, relations: ['user'] });
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  // Only admin or owner (creator) can delete
  if (userRole !== 'admin' && (!task.user || task.user.id !== userId)) {
    return res.status(403).json({ error: 'Forbidden: Only admin or task owner can delete.' });
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
  const allowedStatuses = ["Pending", "Accepted", "In-Progress", "Done"];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value. Allowed: Pending, Accepted, In-Progress, Done." });
  }
  const taskRepo = AppDataSource.getRepository(Task);
  const task = await taskRepo.findOne({ where: { id }, relations: ['user', 'assignee'] });
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }
  // Only owner or assignee can update status
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  if (!userId || (task.user.id !== userId && (!task.assignee || task.assignee.id !== userId))) {
    return res.status(403).json({ error: "Forbidden: Only owner or assignee can update status." });
  }
  // Status workflow enforcement
  const now = Date.now();
  if (task.assignee) {
    // Allow assignee to move from Pending, Accepted, or In-Progress to Done for practical workflow
    if (status === "Accepted" && task.status === "Pending" && task.assignee.id === userId) {
      task.status = "Accepted";
    } else if (status === "In-Progress" && task.status === "Accepted" && task.assignee.id === userId) {
      task.status = "In-Progress";
    } else if (status === "Done" && ["Pending", "Accepted", "In-Progress"].includes(task.status) && task.assignee.id === userId) {
      task.status = "Done";
      task.completedAt = now;
    } else {
      return res.status(400).json({ error: "Invalid status transition or permission." });
    }
  } else {
    // Owner can update status if no assignee
    task.status = status;
    if (status === "Done") {
      task.completedAt = now;
    } else {
      task.completedAt = undefined;
    }
  }
  await taskRepo.save(task);
  // Reload the task with relations to ensure latest status and completedAt
  const updatedTask = await taskRepo.findOne({ where: { id }, relations: ['user', 'assignee'] });
  if (!updatedTask) {
    return res.status(404).json({ error: 'Task not found after update.' });
  }
  res.json({
    id: updatedTask.id,
    title: updatedTask.title,
    category: updatedTask.category,
    dueDate: updatedTask.dueDate,
    completedAt: updatedTask.completedAt,
    status: updatedTask.status,
    user: updatedTask.user ? { id: updatedTask.user.id, email: updatedTask.user.email } : null,
    assignee: updatedTask.assignee ? { id: updatedTask.assignee.id, email: updatedTask.assignee.email } : null,
    isOverdue: computeIsOverdue(updatedTask),
  });
});

/**
 * GET /api/tasks
 * Returns all tasks (not just completed) for the authenticated user with filtering and pagination.
 * Query Parameters:
 *   - category: string (optional) — filter by category
 *   - status: string (optional) — filter by status
 *   - from: string (optional) — filter by completed date (timestamp)
 *   - to: string (optional) — filter by completed date (timestamp)
 *   - dueFrom: string (optional) — filter by due date (timestamp)
 *   - dueTo: string (optional) — filter by due date (timestamp)
 *   - page: number (optional, default: 1) — pagination page
 *   - pageSize: number (optional, default: 20) — pagination size
 *   - sort: string (optional, default: "desc") — sort order
 * Requires authentication (JWT).
 * Returns: Paginated, filtered list of all tasks
 */
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  // Extract query parameters for filtering and pagination
  const { category, from, to, status = "", page = 1, pageSize = 20, sort = "desc", dueFrom, dueTo, owner, assignee } = req.query;
  const taskRepo = AppDataSource.getRepository(Task);

  // Build query for all tasks, joining user and assignee info
  let query = taskRepo.createQueryBuilder("task")
    .leftJoinAndSelect("task.user", "user")
    .leftJoinAndSelect("task.assignee", "assignee");

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
  // Owner filter
  if (owner) query = query.andWhere("user.id = :owner", { owner });
  // Assignee filter
  if (assignee) query = query.andWhere("assignee.id = :assignee", { assignee });

  // Sort results by completedAt, then dueDate
  query = query
    .orderBy("task.completedAt", sort === "asc" ? "ASC" : "DESC")
    .addOrderBy("task.dueDate", sort === "asc" ? "ASC" : "DESC");

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
      assignee: task.assignee ? { id: task.assignee.id, email: task.assignee.email } : null,
      isOverdue: computeIsOverdue(task),
    })),
    total,
    page: Number(page),
    pageSize: Number(pageSize)
  });
});

router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  const userRole = jwtUser && jwtUser.role;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user ID in token.' });
  }
  const taskRepo = AppDataSource.getRepository(Task);
  console.log('[DEBUG] GET /api/tasks/:id', { id });
  const task = await taskRepo.findOne({ where: { id }, relations: ['user', 'assignee'] });
  console.log('[DEBUG] Task found:', task);
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  // Only admin, owner, or assignee can fetch
  const isOwner = task.user && task.user.id === userId;
  const isAssignee = task.assignee && task.assignee.id === userId;
  if (userRole !== 'admin' && !isOwner && !isAssignee) {
    // For security, return 404 if not permitted (do not reveal existence)
    return res.status(404).json({ error: 'Task not found.' });
  }
  res.json({
    id: task.id,
    title: task.title,
    category: task.category,
    status: task.status,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    user: task.user ? { id: task.user.id, email: task.user.email } : null,
    assignee: task.assignee ? { id: task.assignee.id, email: task.assignee.email } : null,
    isOverdue: computeIsOverdue(task),
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
  const { title, category, status, dueDate, assigneeId } = req.body;
  // Allowed status values (workflow only)
  const allowedStatuses = ["Pending", "Accepted", "In-Progress", "Done"];


  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  // Get userId from JWT payload (added by authenticateJWT middleware)
  const jwtUser = (req as any).user;
  const userId = jwtUser && jwtUser.id;
  const userRole = jwtUser && jwtUser.role;
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


  // Only admins can assign at creation. If not admin, force assignee to self.
  let assignee: User | undefined = undefined;
  if (userRole === 'admin' && assigneeId) {
    const foundAssignee = await userRepo.findOneBy({ id: assigneeId });
    if (!foundAssignee) {
      return res.status(400).json({ error: "Assignee not found." });
    }
    assignee = foundAssignee;
  } else {
    assignee = user;
  }

  // If status is missing, default to 'Pending'.
  let computedStatus = status || "Pending";
  // Always validate status, regardless of assignee/admin
  if (!allowedStatuses.includes(computedStatus)) {
    return res.status(400).json({ error: "Invalid status value. Allowed: Pending, Accepted, In-Progress, Done." });
  }
  // If not admin, or if assigning to self, force status to Pending
  if (userRole !== 'admin' || !assigneeId || assignee.id === user.id) {
    computedStatus = "Pending";
  }
  const completedAt = computedStatus === "Done" ? Date.now() : undefined;

  // Create new task entity and save to database
  const task = taskRepo.create({
    title,
    category,
    status: computedStatus,
    dueDate,
    completedAt,
    user,
    assignee,
  });
  await taskRepo.save(task);
  res.json({
    id: task.id,
    title: task.title,
    category: task.category,
    status: task.status,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    user: task.user,
    assignee: task.assignee ? { id: task.assignee.id, email: task.assignee.email } : null,
    isOverdue: computeIsOverdue(task),
  });
});

export default router;