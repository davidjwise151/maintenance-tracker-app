// This file has been removed after merging into rbac_permissions.test.ts
// All tests related to permissions have been consolidated into the unified test suite.
// Please refer to rbac_permissions.test.ts for the complete test cases.
// Unified Permissions Test Suite/**

// Combines permissions.api.test.ts and permissions.test.ts * Permission Enforcement Tests

import { config } from 'dotenv'; * - Verifies backend role-based access control for users and tasks routes

config({ path: require('path').resolve(__dirname, '../../.env') }); * - Uses supertest for HTTP assertions

import request from 'supertest'; */

import app from '../app';import { config } from 'dotenv';

import { AppDataSource } from '../data-source';config({ path: require('path').resolve(__dirname, '../../.env') });

import { User } from '../entity/User';import request from 'supertest';

import { Task } from '../entity/Task';import app from '../app';

import { AppDataSource } from '../data-source';

let adminToken: string;import { User } from '../entity/User';

let userToken: string;import { Task } from '../entity/Task';

let adminId: string;

let userId: string;let adminToken: string;

let createdTaskId: string;let userToken: string;

let user2: any;let adminId: string;

let userId: string;

beforeAll(async () => {let testTaskId: string;

  if (!AppDataSource.isInitialized) {

    await AppDataSource.initialize();

  }beforeAll(async () => {

});  if (!AppDataSource.isInitialized) {

    await AppDataSource.initialize();

beforeEach(async () => {  }

  // Clear all users and tasks for a clean test DB});

  const userRepo = AppDataSource.getRepository(User);

  const taskRepo = AppDataSource.getRepository(Task);beforeEach(async () => {

  await taskRepo.clear();  // Clear all users and tasks for a clean test DB

  await userRepo.clear();  const userRepo = AppDataSource.getRepository(User);

  // Create admin and user accounts  const taskRepo = AppDataSource.getRepository(Task);

  const adminRes = await request(app)  await taskRepo.clear();

    .post('/api/auth/register')  await userRepo.clear();

    .send({ email: 'admin@example.com', password: 'adminpass', role: 'admin' });  // Create admin and user accounts

  adminId = adminRes.body.id;  const adminRes = await request(app)

  const userRes = await request(app)    .post('/api/auth/register')

    .post('/api/auth/register')    .send({ email: 'admin@example.com', password: 'adminpass', role: 'admin' });

    .send({ email: 'user@example.com', password: 'userpass', role: 'user' });  adminId = adminRes.body.id;

  userId = userRes.body.id;  const userRes = await request(app)

  // Login both users    .post('/api/auth/register')

  const adminLogin = await request(app)    .send({ email: 'user@example.com', password: 'userpass', role: 'user' });

    .post('/api/auth/login')  userId = userRes.body.id;

    .send({ email: 'admin@example.com', password: 'adminpass' });  // Login both users

  adminToken = adminLogin.body.token;  const adminLogin = await request(app)

  const userLogin = await request(app)    .post('/api/auth/login')

    .post('/api/auth/login')    .send({ email: 'admin@example.com', password: 'adminpass' });

    .send({ email: 'user@example.com', password: 'userpass' });  adminToken = adminLogin.body.token;

  userToken = userLogin.body.token;  const userLogin = await request(app)

  // Create a test task as user    .post('/api/auth/login')

  const taskRes = await request(app)    .send({ email: 'user@example.com', password: 'userpass' });

    .post('/api/tasks')  userToken = userLogin.body.token;

    .set('Authorization', `Bearer ${userToken}`)  // Create a test task as user

    .send({ title: 'Test Task', status: 'Pending' });  const taskRes = await request(app)

  createdTaskId = taskRes.body.id;    .post('/api/tasks')

  // Register and login user2 for assignment/edge tests    .set('Authorization', `Bearer ${userToken}`)

  await request(app)    .send({ title: 'Test Task', category: 'Other', status: 'Pending' });

    .post('/api/auth/register')  testTaskId = taskRes.body.id;

    .send({ email: 'user2@example.com', password: 'Test1234!' });});

  const usersRes = await request(app)

    .get('/api/users')

    .set('Authorization', `Bearer ${adminToken}`);afterAll(async () => {

  user2 = usersRes.body.users.find((u: any) => u.email === 'user2@example.com');  if (AppDataSource.isInitialized) {

});    await AppDataSource.destroy();

  }

afterAll(async () => {});

  if (AppDataSource.isInitialized) {

    await AppDataSource.destroy();describe('Authentication Errors', () => {

  }  it('should reject unauthenticated requests to protected endpoints', async () => {

});    const res = await request(app)

      .get('/api/users');

// Authentication error tests    expect(res.status).toBe(401);

// ...existing code from permissions.test.ts...  });

// User route permission tests

// ...existing code from permissions.test.ts...  it('should reject requests with invalid token', async () => {

// Task route permission tests    const res = await request(app)

// ...existing code from permissions.test.ts...      .get('/api/users')

// Task assignment & edge case tests      .set('Authorization', 'Bearer invalidtoken');

// ...existing code from permissions.api.test.ts...    expect(res.status).toBe(401);

// All test cases will be inserted in the next step.  });


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
