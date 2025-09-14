
import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

// GET /api/users - Returns all users (id, email) for assignment dropdowns
// Only admin users can list all users
router.get("/", authenticateJWT, authorizeRoles("admin"), async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ select: ["id", "email", "role"] });
  res.json({ users });
});


/**
 * PUT /api/users/:id/role
 * Allows admin to update a user's role (e.g., set to 'admin' for testing)
 * Request body: { role: string }
 * Access: Admin only
 */
router.put("/:id/role", authenticateJWT, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role || !["admin", "user"].includes(role)) {
    return res.status(400).json({ error: "Invalid role value." });
  }
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id });
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  user.role = role;
  await userRepo.save(user);
  res.json({ success: true, id: user.id, email: user.email, role: user.role });
});
export default router;
