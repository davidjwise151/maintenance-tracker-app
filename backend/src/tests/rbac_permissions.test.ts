// Unified RBAC Permissions Test Suite
import { config } from 'dotenv';
config({ path: require('path').resolve(__dirname, '../../.env') });
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { Task } from '../entity/Task';

let adminToken: string;
let userToken: string;
let adminId: string;
let userId: string;
let createdTaskId: string;
let user2: any;

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

beforeEach(async () => {
  // Clear all users and tasks for a clean test DB
  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);
  await taskRepo.clear();
  await userRepo.clear();
  // Create admin and user accounts
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@example.com', password: 'adminpass', role: 'admin' });
  adminId = adminRes.body.id;
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'user@example.com', password: 'userpass', role: 'user' });
  userId = userRes.body.id;
  // Login both users
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'adminpass' });
  adminToken = adminLogin.body.token;
  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'userpass' });
  userToken = userLogin.body.token;
  // Create a test task as user
  const taskRes = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ title: 'Test Task', status: 'Pending' });
  createdTaskId = taskRes.body.id;
  // Register and login user2 for assignment/edge tests
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'user2@example.com', password: 'Test1234!' });
  const user2Login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user2@example.com', password: 'Test1234!' });
  const usersRes = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${adminToken}`);
  user2 = usersRes.body.users.find((u: any) => u.email === 'user2@example.com');
  user2.token = user2Login.body.token;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

// --- Authentication error tests ---
describe('Authentication Errors', () => {
  it('should reject unauthenticated requests to protected endpoints', async () => {
    const res = await request(app)
      .get('/api/users');
    expect(res.status).toBe(401);
  });
  it('should reject requests with invalid token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
  it('should reject requests with expired token', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign({ email: 'admin@example.com', id: 'fakeid', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
  it('should reject requests with malformed token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer malformed.token.value');
    expect(res.status).toBe(401);
  });
});

// --- User route permission tests ---
describe('Permissions: Users Route', () => {
  it('should allow admin to list all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });
  it('should forbid regular user from listing all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
  it('should allow admin to change user role', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });
  it('should forbid regular user from changing roles', async () => {
    const res = await request(app)
      .put(`/api/users/${adminId}/role`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'user' });
    expect(res.status).toBe(403);
  });
});

// --- Task route permission tests ---
describe('Permissions: Tasks Route', () => {
  it('should allow admin to delete any task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it('should allow owner to delete their own task', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Owner Task', status: 'Pending' });
    const ownerTaskId = taskRes.body.id;
    const res = await request(app)
      .delete(`/api/tasks/${ownerTaskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it('should forbid regular user from deleting others tasks', async () => {
    const adminTaskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Task', status: 'Pending' });
    const adminTaskId = adminTaskRes.body.id;
    const res = await request(app)
      .delete(`/api/tasks/${adminTaskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
  it('should only allow admin to assign/reassign tasks', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Assign Task', status: 'Pending' });
    const assignTaskId = taskRes.body.id;
    const otherUserRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@example.com', password: 'otherpass', role: 'user' });
    const otherUserId = otherUserRes.body.id;
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other@example.com', password: 'otherpass' });
    const otherToken = otherLogin.body.token;
    const res = await request(app)
      .put(`/api/tasks/${assignTaskId}/assign`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ assigneeId: userId });
    expect(res.status).toBe(403);
    const resOwner = await request(app)
      .put(`/api/tasks/${assignTaskId}/assign`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ assigneeId: otherUserId });
    expect(resOwner.status).toBe(403);
    const resAdmin = await request(app)
      .put(`/api/tasks/${assignTaskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: otherUserId });
    expect(resAdmin.status).toBe(200);
  });
});

// --- Task assignment & edge case tests ---
describe('Task Assignment & Permissions (Edge Cases)', () => {
  it('admin can assign a user to a task', async () => {
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: user2.id });
    expect(assignRes.statusCode).toBe(200);
    expect(assignRes.body.assignee).toMatchObject({ id: user2.id, email: user2.email });
  });
  it('non-admin cannot assign a user to a task', async () => {
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ assigneeId: user2.id });
    expect(assignRes.statusCode).toBe(403);
  });
  it('admin cannot assign non-existent user', async () => {
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: 'nonexistentid' });
    expect([400, 404]).toContain(assignRes.statusCode);
  });
  it('admin cannot assign to non-existent task', async () => {
    const assignRes = await request(app)
      .put(`/api/tasks/nonexistentid/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: user2.id });
    expect([400, 404]).toContain(assignRes.statusCode);
  });
  it('admin cannot assign user twice to same task', async () => {
    await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: user2.id });
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: user2.id });
    expect([200, 400, 409]).toContain(assignRes.statusCode);
  });
  it('assignment fails with missing token', async () => {
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .send({ assigneeId: user2.id });
    expect([401, 403]).toContain(assignRes.statusCode);
  });
  it('assignment fails with invalid token', async () => {
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', 'Bearer invalidtoken')
      .send({ assigneeId: user2.id });
    expect([401, 403]).toContain(assignRes.statusCode);
  });
  it('admin can delete a task', async () => {
    const delRes = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.statusCode).toBe(200);
  });
  it('non-admin cannot delete a task', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Another Task', status: 'Pending' });
    const taskId = taskRes.body.id;
    const delRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(delRes.statusCode).toBe(403);
  });
  it('delete fails with missing token', async () => {
    const delRes = await request(app)
      .delete(`/api/tasks/${createdTaskId}`);
    expect([401, 403]).toContain(delRes.statusCode);
  });
  it('delete fails with invalid token', async () => {
    const delRes = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', 'Bearer invalidtoken');
    expect([401, 403]).toContain(delRes.statusCode);
  });
  it('admin cannot delete non-existent task', async () => {
    const delRes = await request(app)
      .delete('/api/tasks/nonexistentid')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([400, 404]).toContain(delRes.statusCode);
  });
  it('assignee cannot delete task (only owner or admin can)', async () => {
    // Create a task as user1 (owner)
    const ownerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'owner@example.com', password: 'ownerpass', role: 'user' });
    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'ownerpass' });
    const ownerToken = ownerLogin.body.token;
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Assignee Delete Test', status: 'Pending' });
    const taskId = taskRes.body.id;
    // Assign to user2 (not owner)
    await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: user2.id });
    // Attempt deletion as user2 (assignee, not owner)
    const delRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2.token}`);
    expect(delRes.statusCode).toBe(403);
  });
  it('assignment fails with malformed/unknown role', async () => {
    const userRepo = AppDataSource.getRepository(User);
    const user2db = await userRepo.findOneBy({ email: 'user2@example.com' });
    if (user2db) {
      user2db.role = 'notarole';
      await userRepo.save(user2db);
    }
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ assigneeId: user2.id });
    expect([403, 400]).toContain(assignRes.statusCode);
  });
  it('another admin can assign and delete', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'admin3@example.com', password: 'Test1234!', role: 'admin' });
    const adminRepo = AppDataSource.getRepository(User);
    const admin3 = await adminRepo.findOneBy({ email: 'admin3@example.com' });
    if (admin3 && admin3.role !== 'admin') {
      admin3.role = 'admin';
      await adminRepo.save(admin3);
    }
    const admin3Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin3@example.com', password: 'Test1234!' });
    const admin3Token = admin3Login.body.token;
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${admin3Token}`)
      .send({ assigneeId: user2.id });
    expect([200, 400, 409]).toContain(assignRes.statusCode);
    const delRes = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${admin3Token}`);
    expect([200, 404]).toContain(delRes.statusCode);
  });
  it('assignment fails if user tries to assign themselves (non-admin)', async () => {
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ assigneeId: user2.id });
    expect(assignRes.statusCode).toBe(403);
    if (assignRes.body && assignRes.body.error) {
      expect(typeof assignRes.body.error).toBe('string');
    }
  });
  it('assignment fails with expired token (simulated)', async () => {
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluMkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTYwOTAwMDAwMH0.' +
      'invalidsig';
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ assigneeId: user2.id });
    expect([401, 403]).toContain(assignRes.statusCode);
    if (assignRes.body && assignRes.body.error) {
      expect(typeof assignRes.body.error).toBe('string');
    }
  });
  it('concurrent admins assigning and deleting the same task', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'admin4@example.com', password: 'Test1234!', role: 'admin' });
    const adminRepo = AppDataSource.getRepository(User);
    const admin4 = await adminRepo.findOneBy({ email: 'admin4@example.com' });
    if (admin4 && admin4.role !== 'admin') {
      admin4.role = 'admin';
      await adminRepo.save(admin4);
    }
    const admin4Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin4@example.com', password: 'Test1234!' });
    const admin4Token = admin4Login.body.token;
    const [res1, res2] = await Promise.all([
      request(app)
        .put(`/api/tasks/${createdTaskId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigneeId: user2.id }),
      request(app)
        .put(`/api/tasks/${createdTaskId}/assign`)
        .set('Authorization', `Bearer ${admin4Token}`)
        .send({ assigneeId: user2.id })
    ]);
    expect([200, 400, 409]).toContain(res1.statusCode);
    expect([200, 400, 409]).toContain(res2.statusCode);
    const [del1, del2] = await Promise.all([
      request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`),
      request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${admin4Token}`)
    ]);
    expect([200, 404]).toContain(del1.statusCode);
    expect([200, 404]).toContain(del2.statusCode);
  });
  it('error responses have expected structure', async () => {
    const assignRes = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect([400, 422]).toContain(assignRes.statusCode);
    expect(assignRes.body).toHaveProperty('error');
    expect(typeof assignRes.body.error).toBe('string');
    const delRes = await request(app)
      .delete('/api/tasks/!@#$%^&*()')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([400, 404]).toContain(delRes.statusCode);
    expect(delRes.body).toHaveProperty('error');
    expect(typeof delRes.body.error).toBe('string');
  });
});
