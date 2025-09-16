
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';
import { makeRequest } from './testHelpers';


let adminToken: string;
let userToken: string;
let createdTaskId: string;



beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  // Minimal setup: create admin user and get token for protected route tests
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin4@example.com', password: 'Test1234!', role: 'admin' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin4@example.com', password: 'Test1234!' });
  adminToken = login.body.token;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

/**
 * Seed Endpoint & Error Cases
 *
 * This suite covers:
 *   - /api/seed endpoint (auth, error propagation)
 *   - General error handling for unknown/malformed routes
 *   - Protected route access with/without token
 *
 * Auth validation and registration/login edge cases are covered in auth.api.test.ts.
 */
describe('Seed Endpoint & Error Cases', () => {
  it('should reject seed endpoint without secret', async () => {
    const res = await makeRequest('post', '/api/seed');
    expect(res.statusCode).toBe(403);
  });

  it('should reject seed endpoint with wrong secret', async () => {
    const res = await makeRequest('post', '/api/seed', undefined, {}, { 'x-seed-secret': 'wrongsecret' });
    expect(res.statusCode).toBe(403);
  });

  it('should return 404 for unknown route', async () => {
    const res = await makeRequest('get', '/api/unknown', adminToken);
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 for unknown route with POST', async () => {
    const res = await makeRequest('post', '/api/unknown', adminToken);
    expect(res.statusCode).toBe(404);
  });

  it('should return 405 for method not allowed on seed', async () => {
    const res = await makeRequest('put', '/api/seed', undefined, {}, { 'x-seed-secret': 'somesecret' });
    // Accept 404 or 405 depending on router config
    expect([404, 405]).toContain(res.statusCode);
  });

  it('should return 401 for protected route without token', async () => {
    const res = await makeRequest('get', '/api/users');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for protected route with invalid token', async () => {
    const res = await makeRequest('get', '/api/users', 'invalid.token.here');
    expect([401, 403]).toContain(res.statusCode);
  });

  it('should return 401 for protected route with expired/malformed token', async () => {
    const res = await makeRequest('get', '/api/users', 'malformed');
    expect([401, 403]).toContain(res.statusCode);
  });

  it('should reject seed endpoint with malformed body', async () => {
    const res = await makeRequest('post', '/api/seed', undefined, 'notjson', { 'Content-Type': 'text/plain' });
    expect([400, 403, 415]).toContain(res.statusCode);
  });
});
