
import 'dotenv/config';
import express from 'express';
import authRoutes from "./routes/auth";
import tasksRoutes from "./routes/tasks";
import usersRoutes from "./routes/users";
import { authenticateJWT } from "./middleware/auth";
import seedRouter from "./routes/seed";

const app = express();

// --- CORS CONFIGURATION ---
// Allow only trusted origins: local dev (localhost) and Vercel preview/prod deployments
const allowedOriginPatterns = [
  /^https:\/\/.*\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/
];

// If ALLOWED_ORIGINS env is set, use those (comma-separated, supports regex: prefix)
const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => {
      if (origin.startsWith('regex:')) {
        return new RegExp(origin.replace('regex:', ''));
      }
      return origin;
    })
  : allowedOriginPatterns;

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

interface AuthenticatedRequest extends express.Request {
  user?: any;
}

app.get("/api/protected", authenticateJWT, (req: AuthenticatedRequest, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

app.get("/api/hello", (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

export default app;