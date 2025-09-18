// Jest global setup for database reset
// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

const { AppDataSource } = require('./backend/src/data-source');

beforeEach(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.dropDatabase();
    await AppDataSource.destroy();
  }
  await AppDataSource.initialize();
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
