import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithMockedFetch, Task, getMockTask, renderTaskLogWithTasks, renderTaskLogWithError } from './testHelper';
import MaintenanceTaskLog from '../MaintenanceTaskLog';

describe('MaintenanceTaskLog', () => {
  it('renders the task log title', async () => {
    await renderTaskLogWithTasks([]);
    expect(screen.getByText('Maintenance Task Log')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', async () => {
    await renderTaskLogWithTasks([]);
    expect(await screen.findByText(/no tasks/i)).toBeInTheDocument();
  });

  it('displays a list of tasks when present', async () => {
    const mockTasks: Task[] = [
      getMockTask({ id: '1', title: 'Fix sink', status: 'Pending', category: 'Plumbing' }),
      getMockTask({ id: '2', title: 'Paint wall', status: 'Done', category: 'Painting' }),
    ];
    await renderTaskLogWithTasks(mockTasks);
    for (const task of mockTasks) {
      expect(screen.getByText(task.title)).toBeInTheDocument();
      // Use getAllByText for status/category to avoid multiple match error
      expect(screen.getAllByText(task.status).length).toBeGreaterThan(0);
      expect(screen.getAllByText(task.category).length).toBeGreaterThan(0);
    }
  });

  it('shows error state when fetch fails', async () => {
    await renderTaskLogWithError();
    const errorElements = await screen.findAllByText(/error/i);
    expect(errorElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/error loading tasks/i)).toBeInTheDocument();
  });

  it('displays a task with an assignee', async () => {
    const mockTasks: Task[] = [
      getMockTask({ id: '3', title: 'Replace filter', status: 'Pending', category: 'HVAC', assignee: { email: 'user@example.com' } }),
    ];
    await renderTaskLogWithTasks(mockTasks);
    expect(screen.getByText('Replace filter')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('displays an overdue task', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const mockTasks: Task[] = [
      getMockTask({ id: '4', title: 'Overdue task', status: 'Pending', category: 'Inspections', dueDate: yesterday }),
    ];
    await renderTaskLogWithTasks(mockTasks);
    expect(screen.getByText('Overdue task')).toBeInTheDocument();
    // Optionally check for overdue indicator if present in UI
  });
});
