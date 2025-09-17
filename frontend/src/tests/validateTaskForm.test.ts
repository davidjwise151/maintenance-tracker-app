import { validateTaskForm, TaskFormFields } from "../validateTaskForm";

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
    expect(validateTaskForm({ ...base, title: "" })).toBe("Title is required");
  });

  it("returns error if status is missing", () => {
    expect(validateTaskForm({ ...base, status: "" })).toBe("Status is required");
  });

  it("returns error if status is invalid", () => {
    expect(validateTaskForm({ ...base, status: "InvalidStatus" })).toBe("Invalid status");
  });

  it("returns error if due date is in the past", () => {
    const past = "2025-09-15"; // ISO format, day before mocked today
    expect(validateTaskForm({ ...base, dueDate: past })).toBe("Due date cannot be in the past.");
  });

  it("returns error if due date is too far in future", () => {
    const farFuture = "2031-09-17"; // 6 years ahead of mocked today
    expect(validateTaskForm({ ...base, dueDate: farFuture })).toBe("Due date cannot be more than 5 years from today.");
  });

  it("returns error if status is Done and due date is set", () => {
    expect(validateTaskForm({ title: "Test", status: "Done", dueDate: "2025-09-20" })).toBe("No due date should be set for a task marked as Done.");
  });

  it("returns null for valid input (no due date)", () => {
    expect(validateTaskForm({ ...base })).toBeNull();
  });

  it("returns null for valid input (with due date)", () => {
    expect(validateTaskForm({ ...base, dueDate: "2025-09-20" })).toBeNull();
  });
});
