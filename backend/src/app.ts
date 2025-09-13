import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from "./routes/auth";
import tasksRoutes from "./routes/tasks";
import { authenticateJWT } from "./middleware/auth";

/**
 * Main Express application setup.
 * - Registers middleware for CORS and JSON parsing
 * - Mounts authentication and task routes
 * - Provides test and protected endpoints
 */
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://maintenance-tracker-app.vercel.app',
  /^https:\/\/maintenance-tracker-app-git-.*\.vercel\.app$/
];

// Enable CORS for allowed origins and credentials
app.use(cors({
  origin: (origin, callback) => {
    const isAllowed = !origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin));
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Mount authentication routes
app.use("/api/auth", authRoutes);

/**
 * @route   GET /api/protected
 * @desc    Example protected route, requires valid JWT
 * @access  Private
 * Uses custom AuthenticatedRequest type to access user info from JWT.
 */
interface AuthenticatedRequest extends express.Request {
  user?: any; // Replace 'any' with your actual user type if available
}

// Protected route example
app.get("/api/protected", authenticateJWT, (req: AuthenticatedRequest, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

/**
 * @route   GET /api/hello
 * @desc    Simple hello world endpoint
 * @access  Public
 * Used for testing backend connectivity.
 */
app.get("/api/hello", (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// Mount tasks routes
app.use("/api/tasks", tasksRoutes);

// Export the Express app for use in server startup and testing
export default app;