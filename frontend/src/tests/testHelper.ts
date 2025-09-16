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
 * Helper to mock window.confirm.
 */
export function mockConfirm(value: boolean) {
  window.confirm = jest.fn(() => value);
}

/**
 * Helper to fill and submit the AuthForm for login/register tests.
 */
export async function fillAndSubmitAuthForm({ email, password, mode = 'login' }: { email: string; password: string; mode?: 'login' | 'register' }) {
  // The test should render <AuthForm /> before calling this helper.
  // Switch mode if needed
  if (mode === 'register') {
    const switchBtn = screen.getByRole('button', { name: /register/i });
    fireEvent.click(switchBtn);
  }
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(mode, 'i') }));
}
import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import MaintenanceTaskLog from '../MaintenanceTaskLog';

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
 * @param Component - The React component to render
 * @param fetchData - The object to return from fetch's .json()
 * @param fetchKey - The key to wrap fetchData in (default: 'data'), or null for raw object
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


export function fillAndSubmitCreateTaskForm(data: { title: string; status: string }) {
    const { title, status } = data;
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: title } });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: status } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
}
