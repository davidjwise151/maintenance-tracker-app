
import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

// GET /api/users - Returns all users (id, email) for assignment dropdowns
// Only admin users can list all users
router.get("/", authenticateJWT, authorizeRoles("admin"), async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ select: ["id", "email"] });
  res.json({ users });
});

export default router;
