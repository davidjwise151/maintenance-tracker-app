import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

/**
 * Authentication routes for registration and login.
 * Uses an in-memory user store for demonstration purposes.
 * Replace with a database for production use.
 */
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Dummy user store (replace with DB later)
const users: { [email: string]: { password: string; id: string } } = {};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { message: string, email: string, id: string } on success, { error: string } on failure
 */
router.post(
  "/register",
  [
    // Validate email format and password length
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    // Prevent duplicate registration
    if (users[email]) return res.status(400).json({ error: "User already exists" });
    // Hash password before storing
    const hashed = await bcrypt.hash(password, 10);
    // Generate a simple unique user ID
    const id = Math.random().toString(36).substr(2, 9);
    users[email] = { password: hashed, id };
    res.json({ message: "Registered", email, id });
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and issue JWT
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { token: string } on success, { error: string } on failure
 */
router.post(
  "/login",
  [
    // Validate email format and require password
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = users[email];
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