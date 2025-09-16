import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });
import request from 'supertest';
import app from '../app';

import { AppDataSource } from '../data-source';

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

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'testuser@example.com', password: 'Test1234!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Registered');
    expect(res.body).toHaveProperty('email', 'testuser@example.com');
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('role');
    expect(res.body).not.toHaveProperty('token');
  });

  it('should not register with existing email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'testuser@example.com', password: 'Test1234!' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'testuser@example.com', password: 'Test1234!' });
    expect(res.statusCode).toBe(400);
  });

  it('should login with correct credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'testlogin@example.com', password: 'Test1234!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testlogin@example.com', password: 'Test1234!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should not login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'testfail@example.com', password: 'Test1234!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testfail@example.com', password: 'WrongPass!' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });
});
