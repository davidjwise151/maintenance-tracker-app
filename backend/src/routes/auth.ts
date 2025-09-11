import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Dummy user store (replace with DB later)
const users: { [email: string]: { password: string } } = {};

// Registration
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (users[email]) return res.status(400).json({ error: "User exists" });
  const hashed = await bcrypt.hash(password, 10);
  users[email] = { password: hashed };
  res.json({ message: "Registered" });
});

// Login
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