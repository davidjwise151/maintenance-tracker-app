/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "backend/tsconfig.json",
    }],
  },
  testMatch: ["**/backend/src/tests/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};