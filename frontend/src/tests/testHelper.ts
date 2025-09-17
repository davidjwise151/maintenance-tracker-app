/**
 * Helper to assert the empty state is present in the UI.
 */
export async function expectEmptyState() {
  expect(await screen.findByText(/no tasks/i)).toBeInTheDocument();
}

/**
 * Helper to assert the error state is present in the UI.
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
 */
export async function fillAndSubmitForm(fields: Record<string, string>, submitButton: string | RegExp) {
  for (const [label, value] of Object.entries(fields)) {
    fireEvent.change(screen.getByLabelText(new RegExp(label, 'i')), { target: { value } });
  }
  fireEvent.click(screen.getByRole('button', { name: submitButton }));
}

/**
 * Generic helper to assert an element with text is present.
 */
export async function expectElementPresent(text: string | RegExp) {
  const matches = await screen.findAllByText(text);
  expect(matches.length).toBeGreaterThan(0);
}

/**
 * Helper to mock window.confirm.
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
 */
export async function submitAuthFormWithEnter({ email, password }: { email: string; password: string }) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.keyDown(screen.getByLabelText(/password/i), { key: 'Enter', code: 'Enter' });
}

/**
 * Helper to fill and submit the AuthForm for login/register tests.
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
 */
export function switchAuthMode(mode: 'login' | 'register') {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(mode, 'i') }));
}

/**
 * Helper to assert an error message is present (robust to multiple matches).
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

// Helper type for MaintenanceTaskLog tests
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
  await act(async () => {
    render(React.createElement(Component));
  });
}

/**
 * Helper to render MaintenanceTaskLog with a given list of tasks (mocked fetch).
 */
export async function renderTaskLogWithTasks(tasks: Task[] = []) {
  await renderWithMockedFetch(MaintenanceTaskLog, tasks, 'tasks');
}

/**
 * Helper to render MaintenanceTaskLog with a fetch error.
 */
export async function renderTaskLogWithError() {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
  await act(async () => {
    render(React.createElement(MaintenanceTaskLog));
  });
}

/**
 * Helper to get the Search button in MaintenanceTaskLog.
 */
export function getSearchButton() {
  return screen.getAllByRole('button', { name: /^search$/i })[0];
}

/**
 * Helper to assert a task is present by title.
 */
export function expectTaskPresent(title: string) {
  expect(screen.getByText(title)).toBeInTheDocument();
}

/**
 * Helper to change filters in MaintenanceTaskLog.
 */
export function setTaskLogFilters({ category, status, assignee }: { category?: string; status?: string; assignee?: string }) {
  if (category) fireEvent.change(screen.getByLabelText(/category/i), { target: { value: category } });
  if (status) fireEvent.change(screen.getByLabelText(/status/i), { target: { value: status } });
  const assigneeInput = screen.queryByLabelText(/assignee/i);
  if (assignee && assigneeInput) fireEvent.change(assigneeInput, { target: { value: assignee } });
}

/**
 * Helper to fill and submit the CreateTaskForm.
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
