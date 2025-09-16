import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';


let adminToken: string;
let userToken: string;
let assigneeToken: string;
let createdTaskId: string;

/**
 * Task Acceptance Flow
 *
 * This suite covers:
 *   - Task acceptance by assignee
 *   - Rejection of acceptance by non-assignee
 *
 * User list permission and RBAC are covered in rbac_permissions.test.ts.
 *
 * Uses shared helpers from testHelpers.ts for DRYness.
 */
import { registerAndLoginUser, createAndAssignTask, acceptTask } from './testHelpers';



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
  
  // Register/login users
  const admin = await registerAndLoginUser('admin3@example.com', 'Test1234!', 'admin');
  adminToken = admin.token;
  const user = await registerAndLoginUser('user3@example.com', 'Test1234!');
  userToken = user.token;
  const assignee = await registerAndLoginUser('assignee3@example.com', 'Test1234!');
  assigneeToken = assignee.token;

  // Admin creates a task and assigns to assignee
  if (!assignee.user) {
    throw new Error('Assignee user is null');
  }
  createdTaskId = await createAndAssignTask(adminToken, assignee.user.id);
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

/**
 * Task Acceptance Flow
 *
 * This suite covers:
 *   - Task acceptance by assignee
 *   - Rejection of acceptance by non-assignee
 *
 * User list permission and RBAC are covered in rbac_permissions.test.ts.
 */
describe('Task Acceptance Flow', () => {
  /**
   * Assignee can accept a task assigned to them.
   */
  it('assignee can accept a task', async () => {
    const res = await acceptTask(assigneeToken, createdTaskId);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Accepted');
  });

  /**
   * Non-assignee cannot accept a task.
   */
  it('non-assignee cannot accept a task', async () => {
    const res = await acceptTask(userToken, createdTaskId);
    expect(res.statusCode).toBe(403);
  });
});
