/**
 * Permission Enforcement Tests
 * - Verifies backend role-based access control for users and tasks routes
 * - Uses supertest for HTTP assertions
 */
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
let testTaskId: string;


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
    .send({ title: 'Test Task', category: 'Other', status: 'Pending' });
  testTaskId = taskRes.body.id;
});


afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

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
    // Create a token that is already expired
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

describe('Permissions: Tasks Route', () => {
  it('should allow admin to delete any task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it('should allow owner to delete their own task', async () => {
    // Create another task
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Owner Task', category: 'Other', status: 'Pending' });
    const ownerTaskId = taskRes.body.id;
    const res = await request(app)
      .delete(`/api/tasks/${ownerTaskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it('should forbid regular user from deleting others tasks', async () => {
    // Create a task as admin
    const adminTaskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Task', category: 'Other', status: 'Pending' });
    const adminTaskId = adminTaskRes.body.id;
    // Try to delete as user
    const res = await request(app)
      .delete(`/api/tasks/${adminTaskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
  it('should allow only admin or owner to assign tasks', async () => {
    // Create a new task as user
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Assign Task', category: 'Other', status: 'Pending' });
    const assignTaskId = taskRes.body.id;
    // Try to assign as another user (should fail)
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
    // Assign as owner (should succeed)
    const resOwner = await request(app)
      .put(`/api/tasks/${assignTaskId}/assign`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ assigneeId: otherUserId });
    expect(resOwner.status).toBe(200);
    // Assign as admin (should succeed)
    const resAdmin = await request(app)
      .put(`/api/tasks/${assignTaskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: otherUserId });
    expect(resAdmin.status).toBe(200);
  });
});
