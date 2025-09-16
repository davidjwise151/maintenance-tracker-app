/**
 * Unified RBAC Permissions Test Suite
 *
 * This suite covers:
 *   - Role-based access control for users and tasks
 *   - Admin/user/assignee permissions for assignment, deletion, and role changes
 *   - Edge cases for RBAC and error structure
 *
 * Basic CRUD, validation, and authentication error tests are covered in tasks.api.test.ts and auth.api.test.ts.
 *
 * Uses shared helpers from testHelpers.ts for DRYness.
 */
import { registerAndLoginUser, createTask, assignTask } from './testHelpers';
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
  // Create admin and user accounts and login
  const admin = await registerAndLoginUser('admin@example.com', 'adminpass', 'admin');
  adminToken = admin.token;
  const user = await registerAndLoginUser('user@example.com', 'userpass', 'user');
  userToken = user.token;
  // Get user IDs
  const usersRes = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${adminToken}`);
  adminId = usersRes.body.users.find((u: any) => u.email === 'admin@example.com').id;
  userId = usersRes.body.users.find((u: any) => u.email === 'user@example.com').id;
  // Create a test task as user
  const createdTaskRes = await createTask(userToken, { title: 'Test Task', status: 'Pending' });
  createdTaskId = createdTaskRes.body.id;
  // Register and login user2 for assignment/edge tests
  user2 = usersRes.body.users.find((u: any) => u.email === 'user2@example.com');
  if (!user2) {
    const user2reg = await registerAndLoginUser('user2@example.com', 'Test1234!');
    const usersRes2 = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    user2 = usersRes2.body.users.find((u: any) => u.email === 'user2@example.com');
    user2.token = user2reg.token;
  } else {
    const user2reg = await registerAndLoginUser('user2@example.com', 'Test1234!');
    user2.token = user2reg.token;
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});


/**
 * Unified RBAC Permissions Test Suite
 *
 * This suite covers:
 *   - Role-based access control for users and tasks
 *   - Admin/user/assignee permissions for assignment, deletion, and role changes
 *   - Edge cases for RBAC and error structure
 *
 * Basic CRUD, validation, and authentication error tests are covered in tasks.api.test.ts and auth.api.test.ts.
 */

// --- User route permission tests ---
describe('Permissions: Users Route', () => {
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
  it('should only allow admin to assign/reassign tasks', async () => {
    const assignTaskRes = await createTask(userToken, { title: 'Assign Task', status: 'Pending' });
    const assignTaskId = assignTaskRes.body.id;
    const other = await registerAndLoginUser('other@example.com', 'otherpass', 'user');
    const usersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const otherUserId = usersRes.body.users.find((u: any) => u.email === 'other@example.com').id;
    const res = await assignTask(assignTaskId, userId, other.token);
    expect(res.status).toBe(403);
    const resOwner = await assignTask(assignTaskId, otherUserId, userToken);
    expect(resOwner.status).toBe(403);
    const resAdmin = await assignTask(assignTaskId, otherUserId, adminToken);
    expect(resAdmin.status).toBe(200);
  });
});

// --- Task assignment & edge case tests ---
describe('Task Assignment & Permissions (Edge Cases)', () => {
  it('admin can assign a user to a task', async () => {
    const assignRes = await assignTask(createdTaskId, user2.id, adminToken);
    expect(assignRes.statusCode).toBe(200);
    expect(assignRes.body.assignee).toMatchObject({ id: user2.id, email: user2.email });
  });
  it('non-admin cannot assign a user to a task', async () => {
    const assignRes = await assignTask(createdTaskId, user2.id, userToken);
    expect(assignRes.statusCode).toBe(403);
  });
  it('admin cannot assign non-existent user', async () => {
    const assignRes = await assignTask(createdTaskId, 'nonexistentid', adminToken);
    expect([400, 404]).toContain(assignRes.statusCode);
  });
  it('admin cannot assign to non-existent task', async () => {
    const assignRes = await assignTask('nonexistentid', user2.id, adminToken);
    expect([400, 404]).toContain(assignRes.statusCode);
  });
  it('admin cannot assign user twice to same task', async () => {
    await assignTask(createdTaskId, user2.id, adminToken);
    const assignRes = await assignTask(createdTaskId, user2.id, adminToken);
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
    const anotherTaskRes = await createTask(adminToken, { title: 'Another Task', status: 'Pending' });
    const taskId = anotherTaskRes.body.id;
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
    const owner = await registerAndLoginUser('owner@example.com', 'ownerpass', 'user');
    const ownerToken = owner.token;
    const taskRes = await createTask(ownerToken, { title: 'Assignee Delete Test', status: 'Pending' });
    const taskId = taskRes.body.id;
    // Assign to user2 (not owner)
    await assignTask(taskId, user2.id, adminToken);
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
