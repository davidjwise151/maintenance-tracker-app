import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithMockedFetch, Task } from './testHelper';
import MaintenanceTaskLog from '../MaintenanceTaskLog';

describe('MaintenanceTaskLog', () => {
  it('renders the task log title', async () => {
    await renderWithMockedFetch(MaintenanceTaskLog, [], 'tasks');
    expect(screen.getByText('Maintenance Task Log')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', async () => {
    await renderWithMockedFetch(MaintenanceTaskLog, [], 'tasks');
    expect(await screen.findByText(/no tasks/i)).toBeInTheDocument();
  });

  it('displays a list of tasks when present', async () => {
    const mockTasks: Task[] = [
      { id: '1', title: 'Fix sink', status: 'Pending', category: 'Plumbing', dueDate: null, assignee: null },
      { id: '2', title: 'Paint wall', status: 'Done', category: 'Painting', dueDate: null, assignee: null },
    ];
    await renderWithMockedFetch(MaintenanceTaskLog, mockTasks, 'tasks');
    for (const task of mockTasks) {
      expect(screen.getByText(task.title)).toBeInTheDocument();
      // Use getAllByText for status/category to avoid multiple match error
      expect(screen.getAllByText(task.status).length).toBeGreaterThan(0);
      expect(screen.getAllByText(task.category).length).toBeGreaterThan(0);
    }
  });
});
