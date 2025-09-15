
// Main Express application setup:
// - Registers middleware for CORS and JSON parsing
// - Mounts authentication, user, task, and seed routes
// - Provides test and protected endpoints
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from "./routes/auth";
import tasksRoutes from "./routes/tasks";
import usersRoutes from "./routes/users";
import { authenticateJWT } from "./middleware/auth";
import seedRouter from "./routes/seed";
const app = express();

const isProd = process.env.NODE_ENV === 'production';

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => {
      if (origin.startsWith('regex:')) {
        return new RegExp(origin.replace('regex:', ''));
      }
      return origin;
    })
  : isProd
    ? [] // In production, require explicit ALLOWED_ORIGINS
    : [
        'http://localhost:3000',
        /^https:\/\/.*\.vercel\.app$/,
      ];

app.use(cors({
  origin: (origin, callback) => {
    const isAllowed = !origin || envAllowedOrigins.some(pattern =>
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    );
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true
}));
// Parse JSON request bodies
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/seed", seedRouter);
// Custom request type for JWT-authenticated routes
interface AuthenticatedRequest extends express.Request {
  user?: any;
}

// Example protected route, requires valid JWT
app.get("/api/protected", authenticateJWT, (req: AuthenticatedRequest, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// Simple hello world endpoint for backend connectivity testing
app.get("/api/hello", (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// Export the Express app for use in server startup and testing
export default app;