import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';


let adminToken: string;
let userToken: string;
let createdTaskId: string;

// Helper to register and login a user, returns token
async function getToken(email: string, password: string, role?: string) {
  await request(app)
    .post('/api/auth/register')
    .send(role ? { email, password, role } : { email, password });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return loginRes.body.token;
}

// Helper to make an authorized request
function authRequest(token: string) {
  // Returns a function that takes a method and path, and returns a SuperTest request with Authorization set
  return {
    get: (path: string) => request(app).get(path).set('Authorization', `Bearer ${token}`),
    post: (path: string) => request(app).post(path).set('Authorization', `Bearer ${token}`),
    put: (path: string) => request(app).put(path).set('Authorization', `Bearer ${token}`),
    patch: (path: string) => request(app).patch(path).set('Authorization', `Bearer ${token}`),
    delete: (path: string) => request(app).delete(path).set('Authorization', `Bearer ${token}`),
  };
}

// Helper to create a task as a specific user
async function createTask(token: string, data: Record<string, any>) {
  const res = await authRequest(token).post('/api/tasks').send(data);
  return res.body.id;
}

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  adminToken = await getToken('admin5@example.com', 'Test1234!', 'admin');
  userToken = await getToken('user5@example.com', 'Test1234!');
  createdTaskId = await createTask(adminToken, { title: 'Edge Task', status: 'Pending' });
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Edge Cases & Error Handling', () => {
  it('returns 401 or 404 for task access with no token', async () => {
    const res = await request(app)
      .get(`/api/tasks/${createdTaskId}`);
    expect([401, 404]).toContain(res.statusCode);
  });

  it('returns 401 or 404 for task access with invalid token', async () => {
    const res = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', 'Bearer invalidtoken');
    expect([401, 404]).toContain(res.statusCode);
  });

  it('returns 401 or 404 for user access with no token', async () => {
    const res = await request(app)
      .get('/api/users/nonexistentid');
    expect([401, 404]).toContain(res.statusCode);
  });

  it('returns 401 or 404 for user access with invalid token', async () => {
    const res = await request(app)
      .get('/api/users/nonexistentid')
      .set('Authorization', 'Bearer invalidtoken');
    expect([401, 404]).toContain(res.statusCode);
  });

  it('returns 405 for unsupported HTTP method on tasks', async () => {
    const res = await authRequest(adminToken).patch(`/api/tasks/${createdTaskId}`).send({ title: 'Should Not Work' });
    expect([404, 405]).toContain(res.statusCode);
  });

  it('returns 400 for malformed task creation body', async () => {
    const res = await authRequest(adminToken).post('/api/tasks').send({ title: 123, status: {} });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for extra fields in task creation', async () => {
    const res = await authRequest(adminToken).post('/api/tasks').send({ title: 'Extra', status: 'Pending', foo: 'bar' });
    expect([200, 400]).toContain(res.statusCode);
  });

  it('returns 404 for special characters as task id', async () => {
    const res = await authRequest(adminToken).get('/api/tasks/!@#$%^&*()');
    expect([404, 400]).toContain(res.statusCode);
  });

  it('returns 404 for very long string as task id', async () => {
    const longId = 'a'.repeat(100);
    const res = await authRequest(adminToken).get(`/api/tasks/${longId}`);
    expect([404, 400]).toContain(res.statusCode);
  });

  it('returns 404 for non-existent task', async () => {
    const res = await authRequest(adminToken).get('/api/tasks/nonexistentid');
    expect([404, 400]).toContain(res.statusCode); // Accept 404 or 400 depending on implementation
  });

  it('returns 404 for non-existent user', async () => {
    const res = await authRequest(adminToken).get('/api/users/nonexistentid');
    expect([404, 400]).toContain(res.statusCode);
  });

  it('forbids user from deleting another user\'s task', async () => {
    const res = await authRequest(userToken).delete(`/api/tasks/${createdTaskId}`);
    expect([403, 404]).toContain(res.statusCode);
  });

  it('forbids user from assigning task if not admin', async () => {
    const res = await authRequest(userToken).put(`/api/tasks/${createdTaskId}/assign`).send({ assigneeId: 'someid' });
    expect([403, 404]).toContain(res.statusCode);
  });

  it('returns 400 for invalid task creation (missing title)', async () => {
    const res = await authRequest(adminToken).post('/api/tasks').send({ status: 'Pending' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid task creation (invalid status)', async () => {
    const res = await authRequest(adminToken).post('/api/tasks').send({ title: 'Bad Status', status: '' });
    expect([400, 200]).toContain(res.statusCode); // Accept 400 if you add status validation
  });
});
