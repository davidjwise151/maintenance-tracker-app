
const { AppDataSource } = require('../data-source');

// Utility to reset the database before each test file
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
