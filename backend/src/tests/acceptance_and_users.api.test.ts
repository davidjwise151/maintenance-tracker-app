import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';

let adminToken: string;
let userToken: string;
let assigneeToken: string;
let createdTaskId: string;


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
  // Register and login admin
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin3@example.com', password: 'Test1234!', role: 'admin' });
  const adminUser = await userRepo.findOneBy({ email: 'admin3@example.com' });
  if (adminUser && adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    await userRepo.save(adminUser);
  }
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin3@example.com', password: 'Test1234!' });
  adminToken = adminLogin.body.token;

  // Register and login regular user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'user3@example.com', password: 'Test1234!' });
  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user3@example.com', password: 'Test1234!' });
  userToken = userLogin.body.token;

  // Register and login assignee user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'assignee3@example.com', password: 'Test1234!' });
  const assigneeLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'assignee3@example.com', password: 'Test1234!' });
  assigneeToken = assigneeLogin.body.token;

  // Admin creates a task and assigns to assignee
  const taskRes = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Acceptance Task', status: 'Pending' });
  createdTaskId = taskRes.body.id;
  // Assign assignee
  const assigneeUser = await userRepo.findOneBy({ email: 'assignee3@example.com' });
  if (!assigneeUser) {
    throw new Error('Assignee user not found in DB');
  }
  await request(app)
    .put(`/api/tasks/${createdTaskId}/assign`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ assigneeId: assigneeUser.id });
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Task Acceptance & User List', () => {
  it('assignee can accept a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}/accept`)
      .set('Authorization', `Bearer ${assigneeToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Accepted');
  });

  it('non-assignee cannot accept a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}/accept`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('admin can list all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(3);
  });

  it('non-admin cannot list all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });
});
