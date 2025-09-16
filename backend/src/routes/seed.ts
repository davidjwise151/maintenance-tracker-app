import express from 'express';
import { seedDatabase } from '../scripts/seed';

const router = express.Router();

// Protect with a secret token (set SEED_SECRET in your Render env vars)
router.post('/', async (req, res) => {
  const token = req.headers['x-seed-secret'];
  const secret = process.env.SEED_SECRET;
  if (!secret || token !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await seedDatabase();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
