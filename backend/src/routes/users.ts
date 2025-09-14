import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

const router = Router();

// GET /api/users - Returns all users (id, email) for assignment dropdowns
router.get("/", async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ select: ["id", "email"] });
  res.json({ users });
});

export default router;
