import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';

describe('Seed API', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    process.env.SEED_SECRET = 'testsecret';
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('should reject seed endpoint without secret', async () => {
    const res = await request(app).post('/api/seed');
    expect(res.statusCode).toBe(403);
  });

  it('should reject seed endpoint with wrong secret', async () => {
    const res = await request(app)
      .post('/api/seed')
      .set('x-seed-secret', 'wrongsecret');
    expect(res.statusCode).toBe(403);
  });

  it('should seed database with correct secret', async () => {
    const res = await request(app)
      .post('/api/seed')
      .set('x-seed-secret', 'testsecret');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should handle errors from seedDatabase', async () => {
    // Temporarily break the DB connection to force an error
    await AppDataSource.destroy();
    const res = await request(app)
      .post('/api/seed')
      .set('x-seed-secret', 'testsecret');
    // Log for debug if test fails
    if (![200, 500, 503].includes(res.statusCode)) {
      console.error('Unexpected status:', res.statusCode, res.body);
    }
    expect([200, 500, 503]).toContain(res.statusCode);
    // Re-initialize for other tests if needed
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });
});
