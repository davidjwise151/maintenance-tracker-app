import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

/**
 * Authentication routes for registration and login.
 * - All user queries use TypeORM for secure, parameterized database access.
 * - Passwords are hashed before storage using bcrypt.
 * - JWT is used for stateless authentication.
 */
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Please set it in your cloud provider dashboard.");
}

/**
 * POST /api/auth/register
 * Registers a new user with email and password.
 * - Validates email and password length.
 * - Hashes password before storing.
 * - Prevents duplicate registration.
 * - Returns: { message, email, id } on success, { error } on failure.
 * Access: Public
 */
router.post(
  "/register",
  [
    // Validate email format and password length
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req: Request, res: Response) => {
  // Debug logging removed for production safety
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    const existingUser = await userRepo.findOneBy({ email });
    // Prevent duplicate registration
    if (existingUser) return res.status(400).json({ error: "User already exists" });
  // Hash password before storing
  const hashed = await bcrypt.hash(password, 10);
  // Save the new user to the database, letting TypeORM handle UUID
  const newUser = await userRepo.save({ email, password: hashed });
  res.json({ message: "Registered", email: newUser.email, id: newUser.id });
  }
);

/**
 * POST /api/auth/login
 * Authenticates user and issues JWT token.
 * - Validates email and password.
 * - Checks credentials and password hash.
 * - Returns: { token } on success, { error } on failure.
 * Access: Public
 */
router.post(
  "/login",
  [
    // Validate email format and require password
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req: Request, res: Response) => {
  // Debug logging removed for production safety
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ email });
    // Check if user exists
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    // Compare password with stored hash
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.warn(`Login failed: incorrect password for email ${email}`);
      return res.status(400).json({ error: "Invalid credentials" });
    }
    // Issue JWT token with user info
    const token = jwt.sign({ email, id: user.id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  }
);

export default router;