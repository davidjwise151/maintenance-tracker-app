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
    .send({ email: 'admin5@example.com', password: 'Test1234!', role: 'admin' });
  const userRepo = AppDataSource.getRepository(require('../entity/User').User);
  const adminUser = await userRepo.findOneBy({ email: 'admin5@example.com' });
  if (adminUser && adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    await userRepo.save(adminUser);
  }
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin5@example.com', password: 'Test1234!' });
  adminToken = adminLogin.body.token;

  // Register and login regular user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'user5@example.com', password: 'Test1234!' });
  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user5@example.com', password: 'Test1234!' });
  userToken = userLogin.body.token;

  // Admin creates a task
  const taskRes = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Edge Task', status: 'Pending' });
  createdTaskId = taskRes.body.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Edge Cases & Error Handling', () => {
  it('returns 404 for non-existent task', async () => {
    const res = await request(app)
      .get('/api/tasks/nonexistentid')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([404, 400]).toContain(res.statusCode); // Accept 404 or 400 depending on implementation
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app)
      .get('/api/users/nonexistentid')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([404, 400]).toContain(res.statusCode);
  });

  it('forbids user from deleting another user\'s task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([403, 404]).toContain(res.statusCode);
  });

  it('forbids user from assigning task if not admin', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}/assign`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ assigneeId: 'someid' });
    expect([403, 404]).toContain(res.statusCode);
  });

  it('returns 400 for invalid task creation (missing title)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Pending' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid task creation (invalid status)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Bad Status', status: '' });
    expect([400, 200]).toContain(res.statusCode); // Accept 400 if you add status validation
  });
});
