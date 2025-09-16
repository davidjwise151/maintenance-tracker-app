import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';


let adminToken: string;
let userToken: string;
let assigneeToken: string;
let createdTaskId: string;

// Helper to register and login a user, returns { token, user }
async function registerAndLoginUser(email: string, password: string, role?: string) {
  await request(app)
    .post('/api/auth/register')
    .send(role ? { email, password, role } : { email, password });
  const userRepo = AppDataSource.getRepository(require('../entity/User').User);
  const user = await userRepo.findOneBy({ email });
  if (user && role && user.role !== role) {
    user.role = role;
    await userRepo.save(user);
  }
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return { token: loginRes.body.token, user };
}

// Helper to create a task and assign
async function createAndAssignTask(creatorToken: string, assigneeId: string) {
  const taskRes = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ title: 'Acceptance Task', status: 'Pending' });
  const createdTaskId = taskRes.body.id;
  await request(app)
    .put(`/api/tasks/${createdTaskId}/assign`)
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ assigneeId });
  return createdTaskId;
}


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

  // Register/login users
  const admin = await registerAndLoginUser('admin3@example.com', 'Test1234!', 'admin');
  adminToken = admin.token;
  const user = await registerAndLoginUser('user3@example.com', 'Test1234!');
  userToken = user.token;
  const assignee = await registerAndLoginUser('assignee3@example.com', 'Test1234!');
  assigneeToken = assignee.token;

  // Admin creates a task and assigns to assignee
  if (!assignee.user) {
    throw new Error('Assignee user is null');
  }
  createdTaskId = await createAndAssignTask(adminToken, assignee.user.id);
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
