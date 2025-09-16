import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });
import request from 'supertest';
import app from '../app';

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'testuser@example.com', password: 'Test1234!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
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
  });
});
