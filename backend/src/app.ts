import 'dotenv/config';
import express, { Request } from 'express';
import authRoutes from "./routes/auth";
import tasksRoutes from "./routes/tasks";
import usersRoutes from "./routes/users";
import { authenticateJWT } from "./middleware/auth";
import seedRouter from "./routes/seed";

/**
 * Main Express application setup for Maintenance Tracker API.
 *
 * - Registers CORS and JSON middleware
 * - Mounts authentication, user, task, and seed routes
 * - Provides test and protected endpoints
 *
 * CORS:
 *   - By default, allows localhost (any port) and *.vercel.app for dev and preview/prod
 *   - If ALLOWED_ORIGINS env is set, uses those (comma-separated, supports regex: prefix)
 *   - Allows credentials and Authorization header for JWT auth
 */

const app = express();

// --- CORS CONFIGURATION ---
const allowedOriginPatterns = [
  /^https:\/\/.*\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/
];
const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin =>
      origin.startsWith('regex:') ? new RegExp(origin.replace('regex:', '')) : origin
    )
  : allowedOriginPatterns;

// CORS middleware: allows only trusted origins and required headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = origin && envAllowedOrigins.some(pattern =>
    typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
  );
  if (isAllowed && origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-seed-secret, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/seed", seedRouter);

// Custom request type for JWT-authenticated routes
interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

// Example protected route, requires valid JWT
app.get("/api/protected", authenticateJWT, (req: AuthenticatedRequest, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// Simple hello world endpoint for backend connectivity testing
app.get("/api/hello", (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

export default app;