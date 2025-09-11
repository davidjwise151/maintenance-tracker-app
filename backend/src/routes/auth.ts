import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Authentication routes for registration and login.
 * Uses an in-memory user store for demonstration purposes.
 * Replace with a database for production use.
 */
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Dummy user store (replace with DB later)
const users: { [email: string]: { password: string } } = {};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { message: string } on success, { error: string } on failure
 */
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (users[email]) return res.status(400).json({ error: "User exists" });
  const hashed = await bcrypt.hash(password, 10);
  users[email] = { password: hashed };
  res.json({ message: "Registered" });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and issue JWT
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { token: string } on success, { error: string } on failure
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

export default router;