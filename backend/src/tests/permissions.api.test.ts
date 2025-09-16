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
    .send({ email: 'admin2@example.com', password: 'Test1234!', role: 'admin' });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin2@example.com', password: 'Test1234!' });
  adminToken = adminLogin.body.token;

  // Register and login regular user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'user2@example.com', password: 'Test1234!' });
  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user2@example.com', password: 'Test1234!' });
  userToken = userLogin.body.token;

  // Admin creates a task
  const taskRes = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Admin Task', status: 'Pending' });
  createdTaskId = taskRes.body.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Task Assignment & Permissions', () => {
  it('admin can assign a user to a task', async () => {
    // Get user2's id
    const usersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const user2 = usersRes.body.users.find((u: any) => u.email === 'user2@example.com');
    expect(user2).toBeDefined();
    // Assign user2 to the task
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: user2.id });
    expect(assignRes.statusCode).toBe(200);
    expect(assignRes.body.assignee).toMatchObject({ id: user2.id, email: user2.email });
  });

  it('non-admin cannot assign a user to a task', async () => {
    // Try to assign as regular user
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ assigneeId: 'someid' });
    expect(assignRes.statusCode).toBe(403);
  });

  it('admin can delete a task', async () => {
    const delRes = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.statusCode).toBe(200);
  });

  it('non-admin cannot delete a task', async () => {
    // Create a new task as admin
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Another Task', status: 'Pending' });
    const taskId = taskRes.body.id;
    // Try to delete as regular user
    const delRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(delRes.statusCode).toBe(403);
  });
});
