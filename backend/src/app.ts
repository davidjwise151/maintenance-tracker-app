import express from 'express';
import cors from 'cors';
import authRoutes from "./routes/auth";
import { authenticateJWT } from "./middleware/auth";

// Placeholder for routes and middleware
const app = express();

app.use(cors());
app.use(express.json());

// Auth routes
app.use("/api/auth", authRoutes);

// Example protected route
app.get("/api/protected", authenticateJWT, (req, res) => {
  res.json({ message: "This is a protected route", user: (req as any).user });
});

// Hello World API route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// Maintenance tasks routes
// TODO: Implement CRUD endpoints for tasks

// Placeholder: Due dates, notifications, status tracking, reporting, multi-user support

export default app;