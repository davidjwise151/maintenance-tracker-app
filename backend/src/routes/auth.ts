import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

/**
 * Authentication routes for registration and login.
 * All user queries use TypeORM ORM for secure, parameterized database access.
 * Passwords are hashed before storage. JWT is used for authentication.
 */
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Please set it in your cloud provider dashboard.");
}

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
    console.log("Register request body:", req.body); // Add this line
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
    console.log("Login request body:", req.body); // Add this line
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