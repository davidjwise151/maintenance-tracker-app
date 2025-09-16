const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/src/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/src/tests/testSetup.js"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
