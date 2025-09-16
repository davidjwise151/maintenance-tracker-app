import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';

let userToken: string;


beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

beforeEach(async () => {
  // Clear all users and tasks for a clean test DB
  const userRepo = AppDataSource.getRepository(require('../entity/User').User);
  const taskRepo = AppDataSource.getRepository(require('../entity/Task').Task);
  await taskRepo.clear();
  await userRepo.clear();
  // Register and login a user to get a token
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'taskuser@example.com', password: 'Test1234!' });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'taskuser@example.com', password: 'Test1234!' });
  userToken = loginRes.body.token;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Task API', () => {
  it('should create a task when authenticated', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Task', status: 'Pending' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', 'Test Task');
    expect(res.body).toHaveProperty('status', 'Pending');
  });

  it('should not create a task without auth', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'No Auth Task', description: 'Should fail.' });
    expect(res.statusCode).toBe(401);
  });

  it('should fail validation with missing fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '', status: 'Pending' });
    expect(res.statusCode).toBe(400);
  });
});
