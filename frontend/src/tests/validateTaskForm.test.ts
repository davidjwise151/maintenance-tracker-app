import { validateTaskForm, TaskFormFields } from "../validateTaskForm";
import { expectError, expectValid } from "./testHelper";

describe("validateTaskForm", () => {
  const base: TaskFormFields = { title: "Test", status: "Pending" };

  // Mock system date to 2025-09-16
  const MOCK_DATE = new Date("2025-09-16T12:00:00Z");
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);
  });
  afterAll(() => {
    jest.useRealTimers();
  });


  it("returns error if title is missing", () => {
    expectError(base, { title: "" }, "Title is required");
  });

  it("returns error if status is missing", () => {
    expectError(base, { status: "" }, "Status is required");
  });

  it("returns error if status is invalid", () => {
    expectError(base, { status: "InvalidStatus" }, "Invalid status");
  });

  it("returns error if due date is in the past", () => {
    const past = "2025-09-15"; // ISO format, day before mocked today
    expectError(base, { dueDate: past }, "Due date cannot be in the past.");
  });

  it("returns error if due date is too far in future", () => {
    const farFuture = "2031-09-17"; // 6 years ahead of mocked today
    expectError(base, { dueDate: farFuture }, "Due date cannot be more than 5 years from today.");
  });

  it("returns error if status is Done and due date is set", () => {
    expectError({ title: "Test", status: "Done", dueDate: "2025-09-20" }, {}, "No due date should be set for a task marked as Done.");
  });

  it("returns null for valid input (no due date)", () => {
    expectValid(base);
  });

  it("returns null for valid input (with due date)", () => {
    expectValid(base, { dueDate: "2025-09-20" });
  });
});
