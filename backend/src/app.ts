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
// Mount authentication routes
app.use("/api/auth", authRoutes);
// Mount users routes
app.use("/api/users", usersRoutes);
// Mount tasks routes
app.use("/api/tasks", tasksRoutes);

/**
 * @route   GET /api/protected
 * @desc    Example protected route, requires valid JWT
 * @access  Private
 * Uses custom AuthenticatedRequest type to access user info from JWT.
 */
interface AuthenticatedRequest extends express.Request {
  user?: any;
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

// Temporary admin seeding route for testing (remove after use)
app.post('/api/dev/seed-admin', async (req, res) => {
  const { token } = req.body;
  const expected = process.env.ADMIN_SEED_TOKEN || 'test-seed-token';
  if (token !== expected) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { User } = require('./entity/User');
    const { AppDataSource } = require('./data-source');
    const bcrypt = require('bcryptjs');
    await AppDataSource.initialize();
    const userRepo = AppDataSource.getRepository(User);
    let adminUser = await userRepo.findOneBy({ email: 'david@example.com' });
    if (!adminUser) {
      const hashed = await bcrypt.hash('Password!', 10);
      adminUser = userRepo.create({ email: 'david@example.com', password: hashed, role: 'admin' });
      await userRepo.save(adminUser);
      await AppDataSource.destroy();
      return res.json({ success: true, message: 'Admin user seeded.' });
    } else {
      await AppDataSource.destroy();
      return res.json({ success: false, message: 'Admin user already exists.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Seeding failed.', details: (err as Error)?.message || err });
  }
});

// Dangerous: Deletes all users! Remove after use.
app.delete('/api/dev/delete-all-users', async (req, res) => {
  try {
    const { AppDataSource } = require('./data-source');
    const { User } = require('./entity/User');
    await AppDataSource.initialize();
    await AppDataSource.getRepository(User).clear();
    await AppDataSource.destroy();
    res.json({ success: true, message: 'All users deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete users.' });
  }
});
// Export the Express app for use in server startup and testing
export default app;