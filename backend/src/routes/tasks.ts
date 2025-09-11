import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Task } from "../entity/Task";
import { User } from "../entity/User";

const router = Router();

/**
 * @route   GET /api/tasks/completed
 * @desc    Get completed tasks with optional filters (date, category)
 * @access  Private (should require JWT in production)
 */
router.get("/completed", async (req: Request, res: Response) => {
  const { category, from, to, page = 1, pageSize = 20, sort = "desc" } = req.query;
  const taskRepo = AppDataSource.getRepository(Task);

  let query = taskRepo.createQueryBuilder("task")
    .leftJoinAndSelect("task.user", "user")
    .where("task.status = :status", { status: "Done" });

  if (category) query = query.andWhere("task.category = :category", { category });
  if (from) query = query.andWhere("task.completedAt >= :from", { from });
  if (to) query = query.andWhere("task.completedAt <= :to", { to });

  // Sorting by completedAt
  query = query.orderBy("task.completedAt", sort === "asc" ? "ASC" : "DESC");

  // Pagination
  const skip = (Number(page) - 1) * Number(pageSize);
  query = query.skip(skip).take(Number(pageSize));

  const [tasks, total] = await query.getManyAndCount();

  // Return tasks with pagination info
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
 * @route   POST /api/tasks
 * @desc    Create a new maintenance task
 * @access  Private (should require JWT in production)
 */
router.post("/", async (req: Request, res: Response) => {
  const { title, category, status, userId } = req.body;

  console.log("Task creation request body:", req.body);

  // Error handling for missing userId
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);

  // Find the user by ID
  const user = await userRepo.findOneBy({ id: userId });
  if (!user) {
    return res.status(400).json({ error: "User not found." });
  }

  // Set completedAt if status is "Done"
  const completedAt = status === "Done" ? Date.now() : undefined;

  // Create and save the task
  const task = taskRepo.create({
    title,
    category,
    status,
    completedAt,
    user,
  });
  await taskRepo.save(task);
  res.json(task);
});

export default router;