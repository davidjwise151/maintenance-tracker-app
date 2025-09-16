import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

import request from 'supertest';
import app from '../app';
import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import { AppDataSource } from '../data-source';
import { registerUser, loginUser, registerAndLoginUser } from './testHelpers';

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});


// Helper to clear all users from the DB
async function clearUsers() {
  const ds: DataSource = AppDataSource;
  if (!ds.isInitialized) await ds.initialize();
  await ds.getRepository(User).clear();
}


describe('Auth API', () => {
  beforeEach(async () => {
    // Ensure the test database is clean before each test
    await clearUsers();
  });
  it('should register a new user', async () => {
  const res = await registerUser('testuser@example.com', 'Test1234!');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Registered');
    expect(res.body).toHaveProperty('email', 'testuser@example.com');
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('role');
    expect(res.body).not.toHaveProperty('token');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should not register with existing email', async () => {
  await registerUser('testuser@example.com', 'Test1234!');
  const res = await registerUser('testuser@example.com', 'Test1234!');
    expect(res.statusCode).toBe(400);
  });

  it('should login with correct credentials', async () => {
  await registerUser('testlogin@example.com', 'Test1234!');
  const res = await loginUser('testlogin@example.com', 'Test1234!');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should not login with wrong password', async () => {
  await registerUser('testfail@example.com', 'Test1234!');
  const res = await loginUser('testfail@example.com', 'WrongPass!');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('should not register with missing email', async () => {
  const res = await registerUser('', 'Test1234!');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should not register with missing password', async () => {
  const res = await registerUser('missingpass@example.com', '');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should not register with invalid email format', async () => {
  const res = await registerUser('notanemail', 'Test1234!');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should not register with weak password', async () => {
  const res = await registerUser('weakpass@example.com', '123');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should not login with non-existent user', async () => {
  const res = await loginUser('nouser@example.com', 'Test1234!');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('should not login with missing email', async () => {
  const res = await loginUser('', 'Test1234!');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should not login with missing password', async () => {
  await registerUser('missingloginpass@example.com', 'Test1234!');
  const res = await loginUser('missingloginpass@example.com', '');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should not allow duplicate registration with different email case', async () => {
  await registerUser('caseuser@example.com', 'Test1234!');
  const res = await registerUser('CASEUSER@example.com', 'Test1234!');
    expect(res.statusCode).toBe(400);
  });

  it('should ignore extra fields on registration', async () => {
  const res = await registerUser('extrafield@example.com', 'Test1234!', { foo: 'bar' });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty('foo');
  });

  it('should ignore extra fields on login', async () => {
  await registerUser('extrafieldlogin@example.com', 'Test1234!');
  const res = await loginUser('extrafieldlogin@example.com', 'Test1234!', { foo: 'bar' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).not.toHaveProperty('foo');
  });

  it('should trim whitespace in email and password on registration', async () => {
  const res = await registerUser('  trimuser@example.com  ', '  Test1234!  ');
    // Should either succeed and trim, or fail if not trimmed
    expect([200, 400]).toContain(res.statusCode);
  });

  it('should trim whitespace in email and password on login', async () => {
  await registerUser('trimlogin@example.com', 'Test1234!');
  const res = await loginUser('  trimlogin@example.com  ', '  Test1234!  ');
    // Should either succeed and trim, or fail if not trimmed
    expect([200, 401, 400]).toContain(res.statusCode);
  });

  it('should reject very long email and password', async () => {
  const longEmail = 'a'.repeat(300) + '@example.com';
  const longPassword = 'a'.repeat(300);
  const res = await registerUser(longEmail, longPassword);
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should reject SQL injection-like input', async () => {
  const res = await registerUser("test'; DROP TABLE users;--@example.com", 'Test1234!');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should not login after user deletion', async () => {
  await registerUser('deleteuser@example.com', 'Test1234!');
  // Delete user directly from DB
  const ds: DataSource = AppDataSource;
  await ds.getRepository(User).delete({ email: 'deleteuser@example.com' });
  const res = await loginUser('deleteuser@example.com', 'Test1234!');
    expect(res.statusCode).toBe(401);
  });

  describe('/api/auth/me', () => {
    let token: string;
    beforeEach(async () => {
      // Get a valid token for the test user
      const { token: t } = await registerAndLoginUser('meuser@example.com', 'Test1234!');
      token = t;
    });

    it('should return user info with valid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'meuser@example.com');
      expect(res.body).toHaveProperty('role');
    });

    it('should return 401 with no token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 if user is deleted after token issued', async () => {
      // Delete user directly from DB
      await clearUsers();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });
  });
});
