import express from 'express';
import cors from 'cors';
import authRoutes from "./routes/auth";
import { authenticateJWT } from "./middleware/auth";

/**
 * Main Express application setup.
 * Registers middleware and routes for authentication and API endpoints.
 */
const app = express();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Mount authentication routes at /api/auth
app.use("/api/auth", authRoutes);

/**
 * @route   GET /api/protected
 * @desc    Example protected route, requires valid JWT
 * @access  Private
 */
app.get("/api/protected", authenticateJWT, (req, res) => {
  res.json({ message: "This is a protected route", user: (req as any).user });
});

/**
 * @route   GET /api/hello
 * @desc    Simple hello world endpoint
 * @access  Public
 */
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

export default app;