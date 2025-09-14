import { Router, Request, Response } from "express";
import { authenticateJWT } from "../middleware/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

/**
 * Authentication routes for registration and login.
 * - Uses TypeORM for secure, parameterized database access
 * - Hashes passwords before storage using bcrypt
 * - Issues JWT for stateless authentication
 */
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Please set it in your cloud provider dashboard.");
}

/**
 * POST /api/auth/register
 * Registers a new user with email and password.
 * Security:
 * - Validates email and password length (minimum 6 chars)
 * - Normalizes email to lowercase
 * - Hashes password securely with bcrypt
 * - Prevents duplicate registration
 * - Never returns password in response
 * Returns: { message, email, id } on success, { error } on failure
 * Access: Public
 */
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isString().isIn(["admin", "user"]).withMessage("Role must be 'admin' or 'user'"),
  ],
  async (req: Request, res: Response) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let { email, password, role } = req.body;
    email = email.toLowerCase();
    const userRepo = AppDataSource.getRepository(User);
    // Check for existing user
    const existingUser = await userRepo.findOneBy({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    // Only allow 'admin' role if no admin exists yet
    let assignedRole = "user";
    if (role === "admin") {
      const adminExists = await userRepo.findOneBy({ role: "admin" });
      if (!adminExists) {
        assignedRole = "admin";
      }
    }
    // Hash password and save user
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await userRepo.save({ email, password: hashed, role: assignedRole });
    res.json({ message: "Registered", email: newUser.email, id: newUser.id, role: newUser.role });
  }
);

/**
 * POST /api/auth/login
 * Authenticates user and issues JWT token.
 * Security:
 * - Validates email and password
 * - Normalizes email to lowercase
 * - Checks credentials and password hash securely
 * - Issues JWT token with short expiration (1h)
 * - Never returns password in response
 * Returns: { token } on success, { error } on failure
 * Access: Public
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req: Request, res: Response) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let { email, password } = req.body;
    email = email.toLowerCase();
    const userRepo = AppDataSource.getRepository(User);
    // Find user by email
    const user = await userRepo.findOneBy({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    // Compare password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  // Issue JWT token with role
  const token = jwt.sign({ email, id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
  }
);

export default router;

/**
 * GET /api/auth/me
 * Returns current user info (id, email, role) for authenticated users.
 * Access: Private (JWT required)
 */
router.get("/me", authenticateJWT, async (req: Request, res: Response) => {
  const jwtUser = (req as any).user;
  if (!jwtUser || !jwtUser.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id: jwtUser.id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ id: user.id, email: user.email, role: user.role });
});