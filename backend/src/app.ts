
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
        'http://localhost:5000',
        'http://localhost:5500',
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:4200',
        'http://localhost:8000',
        'http://localhost:1234',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:1234',
        /^https:\/\/.*\.vercel\.app$/,
      ];

// Manual CORS middleware to guarantee correct headers for all requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = !origin || envAllowedOrigins.some(pattern =>
    typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
  );
  if (isAllowed && origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-seed-secret');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

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