import { AppDataSource } from '../data-source';
import { registerAndLoginUser, makeRequest } from './testHelpers';

let adminToken: string;
let userToken: string;
let userId: string;
let adminId: string;

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

beforeEach(async () => {
  // Clean DB
  const userRepo = AppDataSource.getRepository(require('../entity/User').User);
  await userRepo.clear();
  // Register admin and user
  const admin = await registerAndLoginUser('adminuser@example.com', 'Test1234!', 'admin');
  adminToken = admin.token;
  if (!admin.user) throw new Error('admin.user is null');
  adminId = admin.user.id;
  const user = await registerAndLoginUser('normaluser@example.com', 'Test1234!');
  userToken = user.token;
  if (!user.user) throw new Error('user.user is null');
  userId = user.user.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('Users API', () => {
  it('admin can list all users', async () => {
    const res = await makeRequest('get', '/api/users', adminToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.some((u: any) => u.email === 'adminuser@example.com')).toBe(true);
  });

  it('non-admin cannot list all users', async () => {
    const res = await makeRequest('get', '/api/users', userToken);
    expect(res.statusCode).toBe(403);
  });

  it('unauthenticated cannot list users', async () => {
    const res = await makeRequest('get', '/api/users');
    expect(res.statusCode).toBe(401);
  });

  it('admin can update user role', async () => {
    const res = await makeRequest('put', `/api/users/${userId}/role`, adminToken, { role: 'admin' });
    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('cannot update role to invalid value', async () => {
    const res = await makeRequest('put', `/api/users/${userId}/role`, adminToken, { role: 'notarole' });
    expect(res.statusCode).toBe(400);
  });

  it('cannot update role for non-existent user', async () => {
    const res = await makeRequest('put', `/api/users/999999/role`, adminToken, { role: 'admin' });
    expect(res.statusCode).toBe(404);
  });

  it('non-admin cannot update user role', async () => {
    const res = await makeRequest('put', `/api/users/${adminId}/role`, userToken, { role: 'user' });
    expect(res.statusCode).toBe(403);
  });

  it('unauthenticated cannot update user role', async () => {
    const res = await makeRequest('put', `/api/users/${userId}/role`, undefined, { role: 'admin' });
    expect(res.statusCode).toBe(401);
  });

  it('admin can delete a user', async () => {
    const res = await makeRequest('delete', `/api/users/${userId}`, adminToken);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('cannot delete non-existent user', async () => {
    const res = await makeRequest('delete', `/api/users/999999`, adminToken);
    expect(res.statusCode).toBe(404);
  });

  it('cannot delete admin user', async () => {
    const res = await makeRequest('delete', `/api/users/${adminId}`, adminToken);
    expect(res.statusCode).toBe(403);
  });

  it('non-admin cannot delete user', async () => {
    const res = await makeRequest('delete', `/api/users/${userId}`, userToken);
    expect(res.statusCode).toBe(403);
  });

  it('unauthenticated cannot delete user', async () => {
    const res = await makeRequest('delete', `/api/users/${userId}`);
    expect(res.statusCode).toBe(401);
  });
});
