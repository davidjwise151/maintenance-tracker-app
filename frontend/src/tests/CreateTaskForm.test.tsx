// Increase timeout for long-running tests
jest.setTimeout(20000);
import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateTaskForm from '../CreateTaskForm';
import { ToastManagerContext } from '../ToastManager';
import { fillAndSubmitCreateTaskForm } from './testHelper';

describe('CreateTaskForm', () => {
  let toastSpy: jest.Mock;
  function renderWithToast(children: React.ReactNode) {
    toastSpy = jest.fn();
    return render(
      <ToastManagerContext.Provider value={{ showToast: toastSpy }}>
        {children}
      </ToastManagerContext.Provider>
    );
  }

  beforeEach(() => {
    jest.spyOn(window.sessionStorage.__proto__, 'getItem').mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      return null;
    });
    global.fetch = jest.fn((url, options) => {
      const mockResponse = (body: any, ok = true, status = 200) => ({
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        json: async () => body,
        text: async () => JSON.stringify(body),
        headers: { get: () => null },
        redirected: false,
        type: 'basic',
        url: typeof url === 'string' ? url : '',
        clone: () => null,
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
      } as unknown as Response);
      if (typeof url === 'string' && url.includes('/api/users')) {
        return Promise.resolve(mockResponse({ users: [
          { id: 'u1', email: 'user1@example.com' },
          { id: 'u2', email: 'user2@example.com' },
          { id: 'u3', email: 'user3@example.com' }
        ] }));
      }
      return Promise.resolve(mockResponse({}));
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    cleanup();
  });

  it('handles all combinations of category and assignee', async () => {
    const users = [
      { id: 'u1', email: 'user1@example.com' },
      { id: 'u2', email: 'user2@example.com' },
      { id: 'u3', email: 'user3@example.com' }
    ];
    const categories = [
      'Plumbing', 'Flooring', 'Inspections', 'Electrical', 'HVAC', 'Landscaping', 'Painting', 'Other'
    ];
    for (const category of categories) {
      for (const user of users) {
        renderWithToast(<CreateTaskForm />);
        fillAndSubmitCreateTaskForm({
          title: `Test ${category} ${user.email}`,
          status: 'Pending',
          category,
          assigneeId: user.id
        });
        await waitFor(() => expect(toastSpy).not.toHaveBeenCalledWith(expect.any(String), 'error'));
        jest.clearAllMocks();
      }
    }
  });
});