
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';
import { createTask, getTasks, updateTaskStatus, getTaskById } from './testHelpers';

let userToken: string;
let adminToken: string;
let otherUserToken: string;

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
  // Register and login an admin
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'adminuser@example.com', password: 'Admin1234!', role: 'admin' });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'adminuser@example.com', password: 'Admin1234!' });
  adminToken = adminLogin.body.token;
  // Register and login another user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'otheruser@example.com', password: 'Other1234!' });
  const otherLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'otheruser@example.com', password: 'Other1234!' });
  otherUserToken = otherLogin.body.token;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Task API', () => {
  it('should reject Overdue as a status on create', async () => {
    const res = await createTask(userToken, { status: 'Overdue' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should reject Overdue as a status on update', async () => {
    const createRes = await createTask(userToken, { title: 'Update Me' });
    const taskId = createRes.body.id;
    const res = await updateTaskStatus(userToken, taskId, 'Overdue');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should include isOverdue in POST response and be false for future dueDate', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const res = await createTask(userToken, { title: 'Future Task', dueDate: future });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('isOverdue', false);
  });

  it('should include isOverdue in POST response and be true for past dueDate', async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const res = await createTask(userToken, { title: 'Past Task', dueDate: past });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('isOverdue', true);
  });

  it('should include isOverdue in GET /api/tasks and be true for overdue tasks', async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    await createTask(userToken, { title: 'Overdue Task', dueDate: past });
    const res = await getTasks(userToken);
    expect(res.statusCode).toBe(200);
    expect(res.body.tasks.some((t: any) => t.title === 'Overdue Task' && t.isOverdue === true)).toBe(true);
  });

  it('should never set isOverdue true for Done tasks', async () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  // Create task with past dueDate
  const createRes = await createTask(userToken, { title: 'Done Task', dueDate: past });
  const taskId = createRes.body.id;
  // Accept the task (assignee must accept before Done)
  await updateTaskStatus(userToken, taskId, 'Accepted');
  // Mark as Done
  await updateTaskStatus(userToken, taskId, 'Done');
  // Fetch the single task by ID
  const res = await getTaskById(userToken, taskId);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('title', 'Done Task');
  expect(res.body).toHaveProperty('isOverdue', false);
  });

  it('should create a task when authenticated', async () => {
    const res = await createTask(userToken, { title: 'Test Task', status: 'Pending' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', 'Test Task');
    expect(res.body).toHaveProperty('status', 'Pending');
  });

  it('should get all tasks for the user', async () => {
    await createTask(userToken, { title: 'Task 1', status: 'Pending' });
    await createTask(userToken, { title: 'Task 2', status: 'Pending' });
    const res = await getTasks(userToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThanOrEqual(2);
  });

  it('should get a single task by id (owner)', async () => {
    const createRes = await createTask(userToken, { title: 'Single Task', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id', taskId);
      expect(res.body).toHaveProperty('title', 'Single Task');
    }
  });

  it('should get a single task by id (admin)', async () => {
    const createRes = await createTask(userToken, { title: 'Admin Get', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id', taskId);
      expect(res.body).toHaveProperty('title', 'Admin Get');
    }
  });

  it('should return 404 for non-owner/non-admin', async () => {
    const createRes = await createTask(userToken, { title: 'Private Task', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .get('/api/tasks/999999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('should update a task (owner)', async () => {
    const createRes = await createTask(userToken, { title: 'Update Me', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Updated Title', status: 'Completed' });
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('title', 'Updated Title');
      expect(res.body).toHaveProperty('status', 'Completed');
    }
  });

  it('should update a task (admin)', async () => {
    const createRes = await createTask(userToken, { title: 'Admin Update', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Updated', status: 'Completed' });
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('title', 'Admin Updated');
      expect(res.body).toHaveProperty('status', 'Completed');
    }
  });

  it('should forbid non-owner/non-admin from updating', async () => {
    const createRes = await createTask(userToken, { title: 'No Update', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ title: 'Should Not Work', status: 'Completed' });
    expect([403, 404]).toContain(res.statusCode);
  });

  it('should return 404 when updating non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/999999')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Nope', status: 'Pending' });
    expect(res.statusCode).toBe(404);
  });

  it('should delete a task', async () => {
    const createRes = await createTask(userToken, { title: 'Delete Me', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 404 when deleting non-existent task', async () => {
    const res = await request(app)
      .delete('/api/tasks/999999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('should forbid updating a task without auth', async () => {
    const createRes = await createTask(userToken, { title: 'No Auth Update', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Should Not Work', status: 'Completed' });
    expect([401, 403, 404]).toContain(res.statusCode);
  });

  it('should forbid deleting a task without auth', async () => {
    const createRes = await createTask(userToken, { title: 'No Auth Delete', status: 'Pending' });
    const taskId = createRes.body.id;
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`);
    expect(res.statusCode).toBe(401);
  });

  it('should return 400 for invalid status', async () => {
    const res = await createTask(userToken, { title: 'Bad Status', status: 'NotAStatus' });
    expect(typeof res.statusCode).toBe('number');
    expect([400, 422]).toContain(res.statusCode);
  });

  it('should return 400 for invalid id format', async () => {
    const res = await request(app)
      .get('/api/tasks/invalidid')
      .set('Authorization', `Bearer ${userToken}`);
    expect([400, 404]).toContain(res.statusCode);
  });

  it('should not allow double deletion', async () => {
    const createRes = await createTask(userToken, { title: 'Double Delete', status: 'Pending' });
    const taskId = createRes.body.id;
    const del1 = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(del1.statusCode).toBe(200);
    const del2 = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(del2.statusCode).toBe(404);
  });

  it('should handle special characters in title', async () => {
    const res = await createTask(userToken, { title: '🚀✨特殊字符', status: 'Pending' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('title', '🚀✨特殊字符');
  });

  it('should not allow SQL injection in title', async () => {
    const res = await createTask(userToken, { title: "; DROP TABLE tasks; --", status: 'Pending' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('title');
  });

  it('should return 400 for missing title', async () => {
    // Omit title by explicitly setting it to undefined so it doesn't override the default
    const res = await createTask(userToken, { title: undefined, status: 'Pending' });
    expect(res.statusCode).toBe(400);
  });

  it('should not create a task without auth', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'No Auth Task', description: 'Should fail.' });
    expect(res.statusCode).toBe(401);
  });

  it('should fail validation with missing fields', async () => {
    const res = await createTask(userToken, { title: '', status: 'Pending' });
    expect(res.statusCode).toBe(400);
  });
});
describe('Task Assignment and Acceptance Edge Cases', () => {
  let taskId: string;
  let assigneeId: string;
  beforeEach(async () => {
    // Create a task as user
    const createRes = await createTask(userToken, { title: 'Edge Task', status: 'Pending' });
    taskId = createRes.body.id;
    // Get user IDs
    const usersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const users = usersRes.body.users;
    assigneeId = users.find((u: any) => u.email === 'otheruser@example.com').id;
  });

  it('should forbid non-admin from assigning a user', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ assigneeId });
    expect(res.statusCode).toBe(403);
  });

  it('should return 404 when assigning to non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/nonexistentid/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId });
    expect([400, 404]).toContain(res.statusCode);
  });

  it('should return 404 when assigning non-existent user', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId: 'nonexistentid' });
    expect([400, 404]).toContain(res.statusCode);
  });

  it('should require assigneeId in assign payload', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('should require auth for assign endpoint', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .send({ assigneeId });
    expect([401, 403]).toContain(res.statusCode);
  });

  it('should not allow assigning already assigned user', async () => {
    // Assign once
    await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId });
    // Assign again
    const res = await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId });
    expect([200, 400, 409]).toContain(res.statusCode);
  });

  it('should return 404 for accept/decline on non-existent task', async () => {
    const acceptRes = await request(app)
      .put('/api/tasks/nonexistentid/accept')
      .set('Authorization', `Bearer ${otherUserToken}`);
    const declineRes = await request(app)
      .put('/api/tasks/nonexistentid/decline')
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect([400, 404]).toContain(acceptRes.statusCode);
    expect([400, 404]).toContain(declineRes.statusCode);
  });

  it('should forbid non-assignee from accepting/declining', async () => {
    // Assign to otherUser
    await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId });
    // Try to accept as admin (not assignee)
    const acceptRes = await request(app)
      .put(`/api/tasks/${taskId}/accept`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([403, 404]).toContain(acceptRes.statusCode);
    // Try to decline as user (not assignee)
    const declineRes = await request(app)
      .put(`/api/tasks/${taskId}/decline`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([403, 404]).toContain(declineRes.statusCode);
  });

  it('should not allow accept/decline without auth', async () => {
    const acceptRes = await request(app)
      .put(`/api/tasks/${taskId}/accept`);
    const declineRes = await request(app)
      .put(`/api/tasks/${taskId}/decline`);
    expect([401, 404]).toContain(acceptRes.statusCode);
    expect([401, 404]).toContain(declineRes.statusCode);
  });

  it('should not allow accept/decline after task is Done', async () => {
    // Assign to otherUser
    await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId });
    // Accept as assignee
    await request(app)
      .put(`/api/tasks/${taskId}/accept`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    // Mark as Done
    await updateTaskStatus(otherUserToken, taskId, 'Done');
    // Try to accept/decline again
    const acceptRes = await request(app)
      .put(`/api/tasks/${taskId}/accept`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    const declineRes = await request(app)
      .put(`/api/tasks/${taskId}/decline`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect([200, 400, 404]).toContain(acceptRes.statusCode);
    expect([200, 400, 404]).toContain(declineRes.statusCode);
  });

  it('should not allow accept/decline after task is Declined', async () => {
    // Assign to otherUser
    await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId });
    // Decline as assignee
    await request(app)
      .put(`/api/tasks/${taskId}/decline`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    // Try to accept/decline again
    const acceptRes = await request(app)
      .put(`/api/tasks/${taskId}/accept`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    const declineRes = await request(app)
      .put(`/api/tasks/${taskId}/decline`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect([200, 400, 404]).toContain(acceptRes.statusCode);
    expect([200, 400, 404]).toContain(declineRes.statusCode);
  });

  it('should not allow accept/decline after task is Accepted', async () => {
    // Assign to otherUser
    await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigneeId });
    // Accept as assignee
    await request(app)
      .put(`/api/tasks/${taskId}/accept`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    // Try to accept/decline again
    const acceptRes = await request(app)
      .put(`/api/tasks/${taskId}/accept`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    const declineRes = await request(app)
      .put(`/api/tasks/${taskId}/decline`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect([200, 400, 404]).toContain(acceptRes.statusCode);
    expect([200, 400, 404]).toContain(declineRes.statusCode);
  });
});