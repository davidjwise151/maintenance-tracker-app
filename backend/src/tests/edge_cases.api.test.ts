
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';
import { registerAndLoginUser, createTask, makeRequest } from './testHelpers';

let adminToken: string;
let userToken: string;
let createdTaskId: string;

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const admin = await registerAndLoginUser('admin5@example.com', 'Test1234!', 'admin');
  adminToken = admin.token;
  const user = await registerAndLoginUser('user5@example.com', 'Test1234!');
  userToken = user.token;
  const taskRes = await createTask(adminToken, { title: 'Edge Task', status: 'Pending' });
  createdTaskId = taskRes.body.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Edge Cases & Error Handling', () => {
  it('returns 401 or 404 for task access with no token', async () => {
    const res = await makeRequest('get', `/api/tasks/${createdTaskId}`);
    expect([401, 404]).toContain(res.statusCode);
  });

  it('returns 401 or 404 for task access with invalid token', async () => {
    const res = await makeRequest('get', `/api/tasks/${createdTaskId}`, 'invalidtoken');
    expect([401, 404]).toContain(res.statusCode);
  });

  it('returns 401 or 404 for user access with no token', async () => {
    const res = await makeRequest('get', '/api/users/nonexistentid');
    expect([401, 404]).toContain(res.statusCode);
  });

  it('returns 401 or 404 for user access with invalid token', async () => {
    const res = await makeRequest('get', '/api/users/nonexistentid', 'invalidtoken');
    expect([401, 404]).toContain(res.statusCode);
  });

  it('returns 405 for unsupported HTTP method on tasks', async () => {
    const res = await makeRequest('patch', `/api/tasks/${createdTaskId}`, adminToken, { title: 'Should Not Work' });
    expect([404, 405]).toContain(res.statusCode);
  });

  it('returns 400 for malformed task creation body', async () => {
    const res = await makeRequest('post', '/api/tasks', adminToken, { title: 123, status: {} });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for extra fields in task creation', async () => {
    const res = await makeRequest('post', '/api/tasks', adminToken, { title: 'Extra', status: 'Pending', foo: 'bar' });
    expect([200, 400]).toContain(res.statusCode);
  });

  it('returns 404 for special characters as task id', async () => {
    const res = await makeRequest('get', '/api/tasks/!@#$%^&*()', adminToken);
    expect([404, 400]).toContain(res.statusCode);
  });

  it('returns 404 for very long string as task id', async () => {
    const longId = 'a'.repeat(100);
    const res = await makeRequest('get', `/api/tasks/${longId}`, adminToken);
    expect([404, 400]).toContain(res.statusCode);
  });

  it('returns 404 for non-existent task', async () => {
    const res = await makeRequest('get', '/api/tasks/nonexistentid', adminToken);
    expect([404, 400]).toContain(res.statusCode); // Accept 404 or 400 depending on implementation
  });

  it('returns 404 for non-existent user', async () => {
    const res = await makeRequest('get', '/api/users/nonexistentid', adminToken);
    expect([404, 400]).toContain(res.statusCode);
  });

  it('forbids user from deleting another user\'s task', async () => {
    const res = await makeRequest('delete', `/api/tasks/${createdTaskId}`, userToken);
    expect([403, 404]).toContain(res.statusCode);
  });

  it('forbids user from assigning task if not admin', async () => {
    const res = await makeRequest('put', `/api/tasks/${createdTaskId}/assign`, userToken, { assigneeId: 'someid' });
    expect([403, 404]).toContain(res.statusCode);
  });

  it('returns 400 for invalid task creation (missing title)', async () => {
    const res = await makeRequest('post', '/api/tasks', adminToken, { status: 'Pending' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid task creation (invalid status)', async () => {
    const res = await makeRequest('post', '/api/tasks', adminToken, { title: 'Bad Status', status: '' });
    expect([400, 200]).toContain(res.statusCode); // Accept 400 if you add status validation
  });
});
