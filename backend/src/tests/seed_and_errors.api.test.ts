import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';

let adminToken: string;
let userToken: string;
let createdTaskId: string;

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  // Register and login admin
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin4@example.com', password: 'Test1234!', role: 'admin' });
  const userRepo = AppDataSource.getRepository(require('../entity/User').User);
  const adminUser = await userRepo.findOneBy({ email: 'admin4@example.com' });
  if (adminUser && adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    await userRepo.save(adminUser);
  }
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin4@example.com', password: 'Test1234!' });
  adminToken = adminLogin.body.token;

  // Register and login regular user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'user4@example.com', password: 'Test1234!' });
  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user4@example.com', password: 'Test1234!' });
  userToken = userLogin.body.token;

  // Admin creates a task
  const taskRes = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Seeded Task', status: 'Pending' });
  createdTaskId = taskRes.body.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Seed Endpoint & Error Cases', () => {
  it('should reject seed endpoint without secret', async () => {
    const res = await request(app)
      .post('/api/seed')
      .send({});
    expect(res.statusCode).toBe(403);
  });

  it('should reject seed endpoint with wrong secret', async () => {
    const res = await request(app)
      .post('/api/seed')
      .set('x-seed-secret', 'wrongsecret')
      .send({});
    expect(res.statusCode).toBe(403);
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app)
      .get('/api/unknown')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('should return 401 for protected route without token', async () => {
    const res = await request(app)
      .get('/api/users');
    expect(res.statusCode).toBe(401);
  });

  it('should return 400 for invalid login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user4@example.com', password: 'WrongPassword!' });
    expect(res.statusCode).toBe(401);
  });
});
