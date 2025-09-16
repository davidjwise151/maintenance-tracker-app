/**
 * Accepts a task as the given user.
 * @param token Auth token of the user
 * @param taskId Task ID to accept
 */
export async function acceptTask(token: string, taskId: string) {
  return request(app)
    .put(`/api/tasks/${taskId}/accept`)
    .set('Authorization', `Bearer ${token}`);
}

/**
* Creates a task as creator and assigns it to assignee.
 * @param creatorToken Auth token of the creator
 * @param assigneeId User ID of the assignee
 * @param overrides Optional task fields
 * @returns The created task ID
 */
export async function createAndAssignTask(creatorToken: string, assigneeId: string, overrides: any = {}) {
  const taskRes = await createTask(creatorToken, { title: 'Acceptance Task', status: 'Pending', ...overrides });
  const createdTaskId = taskRes.body.id;
  await assignTask(createdTaskId, assigneeId, creatorToken);
  return createdTaskId;
}
/**
 * Gets all tasks for a user (authenticated request).
 */
export async function getTasks(token: string) {
  return request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${token}`);
}

/**
 * Updates the status of a task as the given user.
 */
export async function updateTaskStatus(token: string, taskId: string, status: string) {
  return request(app)
    .put(`/api/tasks/${taskId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status });
}

/**
 * Gets a single task by ID as the given user.
 */
export async function getTaskById(token: string, taskId: string) {
  return request(app)
    .get(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`);
}
/**
 * Test Helpers for Maintenance Tracker Backend
 *
 * This module provides DRY, reusable helper functions for user registration, login, task creation,
 * assignment, and authenticated requests. Import these helpers in your test suites to avoid duplication
 * and ensure consistent test setup and flows.
 */

import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';

/**
 * Registers a user and returns the response.
 */

/**
 * Registers a user and returns the response. Accepts extra fields for edge case testing.
 */
export async function registerUser(email: string, password: string, extra?: Record<string, any> | string) {
  let payload: any = { email, password };
  if (typeof extra === 'string' && extra) {
    payload.role = extra;
  } else if (typeof extra === 'object' && extra !== null) {
    payload = { ...payload, ...extra };
  }
  return request(app)
    .post('/api/auth/register')
    .send(payload);
}

/**
 * Logs in a user and returns the response.
 */

/**
 * Logs in a user and returns the response. Accepts extra fields for edge case testing.
 */
export async function loginUser(email: string, password: string, extra?: Record<string, any>) {
  let payload: any = { email, password };
  if (extra && typeof extra === 'object') {
    payload = { ...payload, ...extra };
  }
  return request(app)
    .post('/api/auth/login')
    .send(payload);
}

/**
 * Registers and logs in a user, returning { token, user }.
 */
export async function registerAndLoginUser(email: string, password: string, role?: string) {
  await registerUser(email, password, role);
  const userRepo = AppDataSource.getRepository(require('../entity/User').User);
  const user = await userRepo.findOneBy({ email });
  if (user && role && user.role !== role) {
    user.role = role;
    await userRepo.save(user);
  }
  const loginRes = await loginUser(email, password);
  return { token: loginRes.body.token, user };
}

/**
 * Creates a task as the given user.
 */
export async function createTask(token: string, overrides: any = {}) {
  const defaultTask = { title: 'Test Task', status: 'Pending', ...overrides };
  return request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send(defaultTask);
}

/**
 * Assigns a user to a task (admin only).
 */
export async function assignTask(taskId: string, assigneeId: string, token: string) {
  return request(app)
    .put(`/api/tasks/${taskId}/assign`)
    .set('Authorization', `Bearer ${token}`)
    .send({ assigneeId });
}

/**
 * Makes a request with optional token and headers (for error/edge case testing).
 */
export function makeRequest(method: 'get'|'post'|'put'|'delete'|'patch', url: string, token?: string, body?: any, headers?: any) {
  let req = request(app)[method](url);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (headers) Object.entries(headers).forEach(([k, v]) => req = req.set(k, String(v)));
  if (body) req = req.send(body);
  return req;
}
