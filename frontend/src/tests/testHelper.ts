/**
 * Renders the MaintenanceTaskLog component as an admin user, with session and fetch mocks.
 * Ensures all API calls for tasks and users are intercepted and return provided mock data.
 * Use this helper for any test that needs admin privileges and backend data mocking.
 *
 * @param {Task[]} tasks - Array of mock tasks to return from /api/tasks
 * @param {any[]} users - Array of mock users to return from /api/users
 * @returns {Promise<void>} Resolves when the component is rendered
 */
export async function renderTaskLogAsAdminWithTasks(
  tasks: Task[] = [getMockTask()],
  users: any[] = [{ id: 'u1', email: 'user@example.com' }]
) {
  mockAdminSession();
  // Securely mock fetch for both /api/tasks and /api/users endpoints
  global.fetch = jest.fn((input) => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else if (input instanceof URL) {
      url = input.toString();
    }
    if (url.includes('/api/tasks')) {
      return Promise.resolve({ ok: true, json: async () => ({ tasks }) } as Response);
    }
    if (url.includes('/api/users')) {
      return Promise.resolve({ ok: true, json: async () => ({ users }) } as Response);
    }
    // Default: return empty object for any other endpoint
    return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
  });
  await act(async () => {
    render(React.createElement(require('../MaintenanceTaskLog').default, { userRole: 'admin' }));
  });
}

import { validateTaskForm, TaskFormFields } from "../validateTaskForm";
/**
 * Helper for validateTaskForm error assertion.
 * 
 * Asserts that validateTaskForm returns the expected error message for given overrides.
 * @param {TaskFormFields} base - The base form fields
 * @param {Partial<TaskFormFields>} overrides - Fields to override
 * @param {string} errorMsg - The expected error message
 */
export function expectError(base: TaskFormFields, overrides: Partial<TaskFormFields>, errorMsg: string) {
  expect(validateTaskForm({ ...base, ...overrides })).toBe(errorMsg);
}

/**
 * Helper for validateTaskForm valid assertion.

 * Asserts that validateTaskForm returns null (no error) for given overrides.
 * @param {TaskFormFields} base - The base form fields
 * @param {Partial<TaskFormFields>} [overrides={}] - Fields to override
 */
export function expectValid(base: TaskFormFields, overrides: Partial<TaskFormFields> = {}) {
  expect(validateTaskForm({ ...base, ...overrides })).toBeNull();
}
/**
 * Helper to assert the empty state is present in the UI.
 * 
 * Asserts that the UI displays the empty state ("no tasks") message.
 */
export async function expectEmptyState() {
  expect(await screen.findByText(/no tasks/i)).toBeInTheDocument();
}

/**
 * Helper to assert the error state is present in the UI.
 * 
 * Asserts that the UI displays an error state (error message present).
 */
export async function expectErrorState() {
  const errorElements = await screen.findAllByText(/error/i);
  expect(errorElements.length).toBeGreaterThan(0);
  expect(screen.getByText(/error loading tasks/i)).toBeInTheDocument();
}
/**
 * --------------------
 * General Test Helpers
 * --------------------
 */

import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import MaintenanceTaskLog from '../MaintenanceTaskLog';

/**
 * Generic helper to fill and submit any form by label/value mapping.
 * 
 * Fills and submits a form by mapping labels to values and clicking the submit button.
 * @param {Record<string, string>} fields - Label/value pairs to fill
 * @param {string|RegExp} submitButton - The button label or regex to submit
 */
export async function fillAndSubmitForm(fields: Record<string, string>, submitButton: string | RegExp) {
  for (const [label, value] of Object.entries(fields)) {
    fireEvent.change(screen.getByLabelText(new RegExp(label, 'i')), { target: { value } });
  }
  fireEvent.click(screen.getByRole('button', { name: submitButton }));
}


/**
 * Helper to mock window.confirm.
 * 
 * Mocks window.confirm to always return the provided value.
 * @param {boolean} value - The value to return from confirm
 */
export function mockConfirm(value: boolean) {
  window.confirm = jest.fn(() => value);
}

/**
 * --------------------
 * AuthForm Helpers
 * --------------------
 */

/**
 * Helper to fill and submit the AuthForm using Enter key.
 * 
 * Fills and submits the AuthForm using the Enter key.
 * @param {{ email: string, password: string }} param0 - Auth credentials
 */
export async function submitAuthFormWithEnter({ email, password }: { email: string; password: string }) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.keyDown(screen.getByLabelText(/password/i), { key: 'Enter', code: 'Enter' });
}

/**
 * Helper to fill and submit the AuthForm for login/register tests.
 * 
 * Fills and submits the AuthForm for login/register tests.
 * @param {{ email: string, password: string, mode?: 'login'|'register' }} param0 - Auth credentials and mode
 */
export async function fillAndSubmitAuthForm({ email, password, mode = 'login' }: { email: string; password: string; mode?: 'login' | 'register' }) {
  if (mode === 'register') {
    switchAuthMode('register');
  }
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(mode, 'i') }));
}

/**
 * Helper to switch AuthForm mode.
 * 
 * Switches the AuthForm mode by clicking the appropriate button.
 * @param {'login'|'register'} mode - The mode to switch to
 */
export function switchAuthMode(mode: 'login' | 'register') {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(mode, 'i') }));
}

/**
 * Helper to assert an error message is present (robust to multiple matches).
 * 
 * Asserts that an error message is present in the UI.
 * @param {string|RegExp} message - The error message or regex to match
 */
export async function expectErrorMessage(message: string | RegExp) {
  const matches = await screen.findAllByText(message);
  expect(matches.length).toBeGreaterThan(0);
}

/**
 * --------------------
 * MaintenanceTaskLog Helpers
 * --------------------
 */
/**
 * 
 * Helper type for MaintenanceTaskLog tests
 * Type representing a maintenance task for test helpers.
 */
export type Task = {
  id: string;
  title: string;
  status: string;
  category: string;
  dueDate: string | null;
  assignee: any;
};

/**
 * Helper to generate a mock task object for MaintenanceTaskLog tests.
 * 
 * Generates a mock task object for MaintenanceTaskLog tests.
 * @param {Partial<Task>} [overrides={}] - Fields to override in the default task
 * @returns {Task} The mock task
 */
export function getMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    title: 'Default Task',
    status: 'Pending',
    category: 'Plumbing',
    dueDate: null,
    assignee: null,
    ...overrides,
  };
}

/**
 * General helper to render a component with a mocked fetch response.
 * 
 * Renders a component with a mocked fetch response for a single endpoint.
 * @param {React.ElementType} Component - The component to render
 * @param {any} fetchData - The data to return from fetch
 * @param {string|null} fetchKey - The key to wrap the data in (optional)
 */
export async function renderWithMockedFetch(
  Component: React.ElementType,
  fetchData: any,
  fetchKey: string | null = null
) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => (fetchKey ? { [fetchKey]: fetchData } : fetchData),
    } as unknown as Response)
  );
  // Always wrap in act to avoid warnings
  await act(async () => {
    render(React.createElement(Component));
  });
}

/**
 * Helper to render MaintenanceTaskLog with a given list of tasks (mocked fetch).
 * 
 * Renders MaintenanceTaskLog with a given list of tasks (mocked fetch).
 * @param {Task[]} tasks - The tasks to mock from /api/tasks
 */
export async function renderTaskLogWithTasks(tasks: Task[] = []) {
  // Always wrap in act to avoid warnings
  await act(async () => {
    await renderWithMockedFetch(MaintenanceTaskLog, tasks, 'tasks');
  });
}

/**
 * Helper to render MaintenanceTaskLog with a fetch error.
 * 
 * Renders MaintenanceTaskLog with a fetch error (simulates network failure).
 */
export async function renderTaskLogWithError() {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
  await act(async () => {
    render(React.createElement(MaintenanceTaskLog));
  });
}

/**
 * Helper to get the Search button in MaintenanceTaskLog.
 * 
 * Returns the first Search button in the MaintenanceTaskLog UI.
 * @returns {HTMLElement} The search button
 */
export function getSearchButton() {
  return screen.getAllByRole('button', { name: /^search$/i })[0];
}

/**
 * Helper to assert a task is present by title.
 * 
 * Asserts that a task with the given title is present in the UI.
 * @param {string} title - The task title
 */
export function expectTaskPresent(title: string) {
  expect(screen.getByText(title)).toBeInTheDocument();
}

/**
 * Helper to change filters in MaintenanceTaskLog.
 * 
 * Changes filters in MaintenanceTaskLog by firing change events on filter inputs.
 * @param {{ category?: string, status?: string, assignee?: string }} filters - Filter values
 */
export function setTaskLogFilters({ category, status, assignee }: { category?: string; status?: string; assignee?: string }) {
  if (category) fireEvent.change(screen.getByLabelText(/category/i), { target: { value: category } });
  if (status) fireEvent.change(screen.getByLabelText(/status/i), { target: { value: status } });
  const assigneeInput = screen.queryByLabelText(/assignee/i);
  if (assignee && assigneeInput) fireEvent.change(assigneeInput, { target: { value: assignee } });
}

/**
 * Helper to fill and submit the CreateTaskForm.
 * 
 * Fills and submits the CreateTaskForm with provided data.
 * @param {{ title: string, status: string, dueDate?: string, category?: string, assigneeId?: string }} data - Task form data
 */
export function fillAndSubmitCreateTaskForm(data: {
  title: string;
  status: string;
  dueDate?: string;
  category?: string;
  assigneeId?: string;
}) {
  const { title, status, dueDate, category, assigneeId } = data;
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: title } });
  if (dueDate !== undefined) {
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: dueDate } });
  }
  if (category !== undefined) {
    const select = screen.getByLabelText(/category/i);
    fireEvent.change(select, { target: { value: category } });
    // Debug: log selected value
    // eslint-disable-next-line no-console
    console.log('Category select value before submit:', (select as HTMLSelectElement).value);
  }
  if (assigneeId !== undefined) {
    const select = screen.getByLabelText(/assignee/i);
    fireEvent.change(select, { target: { value: assigneeId } });
    // Debug: log selected value
    // eslint-disable-next-line no-console
    console.log('Assignee select value before submit:', (select as HTMLSelectElement).value);
  }
  const statusSelect = screen.getByLabelText(/status/i);
  fireEvent.change(statusSelect, { target: { value: status } });
  // Debug: log selected value
  // eslint-disable-next-line no-console
  console.log('Status select value before submit:', (statusSelect as HTMLSelectElement).value);
  fireEvent.click(screen.getAllByRole('button', { name: /create task/i })[0]);
}

/** Helper to fill and submit the AssignTaskForm.
 * 
 * Mocks sessionStorage as an admin user for tests.
 * Sets userEmail and token for admin privileges.
 * Use before rendering components that require admin context.
 */
export function mockAdminSession() {
  const adminUser = { id: 'admin1', email: 'admin@example.com' };
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: (key: string) => {
        if (key === 'userEmail') return adminUser.email;
        if (key === 'token') return 'admintoken';
        return null;
      },
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    writable: true,
  });
}