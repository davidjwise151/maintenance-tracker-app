// Jest global setup for database reset
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
