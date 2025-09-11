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
 * Uses custom AuthenticatedRequest type to access user info from JWT.
 */
interface AuthenticatedRequest extends express.Request {
  user?: any; // Replace 'any' with your actual user type if available
}

app.get("/api/protected", authenticateJWT, (req: AuthenticatedRequest, res) => {
  // Responds only if JWT is valid and user info is attached by middleware
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

// Export the Express app for use in server startup and testing
export default app;