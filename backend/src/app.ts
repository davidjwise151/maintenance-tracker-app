import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from "./routes/auth";
import tasksRoutes from "./routes/tasks";
import usersRoutes from "./routes/users";
import { authenticateJWT } from "./middleware/auth";

/**
 * Main Express application setup.
 * - Registers middleware for CORS and JSON parsing
 * - Mounts authentication and task routes
 * - Provides test and protected endpoints
 */
const app = express();


// Dynamic CORS origin configuration
const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => {
      if (origin.startsWith('regex:')) {
        return new RegExp(origin.replace('regex:', ''));
      }
      return origin;
    })
  : [
      'http://localhost:3000',
      /^https:\/\/.*\.vercel\.app$/,
    ];


// Debug: Log all incoming requests and CORS origins
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.originalUrl} from origin: ${req.headers.origin}`);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    const isAllowed = !origin || envAllowedOrigins.some(pattern => typeof pattern === 'string' ? pattern === origin : pattern.test(origin));
    if (!isAllowed) {
      console.log(`[DEBUG] CORS rejected origin: ${origin}`);
    } else {
      console.log(`[DEBUG] CORS allowed origin: ${origin}`);
    }
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Mount authentication routes
app.use("/api/auth", authRoutes);
// Mount users routes
app.use("/api/users", usersRoutes);

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