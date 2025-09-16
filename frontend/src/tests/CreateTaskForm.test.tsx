import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateTaskForm from '../CreateTaskForm';
import { fillAndSubmitCreateTaskForm } from './testHelper';

describe('CreateTaskForm', () => {
  beforeEach(() => {
    // Mock sessionStorage.getItem to always return a token unless overridden
    jest.spyOn(window.sessionStorage.__proto__, 'getItem').mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      return null;
    });
    // Mock fetch to prevent real network requests
    global.fetch = jest.fn((url, options) => {
      // Minimal mock Response object
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
        clone: () => this,
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
      } as unknown as Response);
      // For GET /api/users, return a fake user list
      if (typeof url === 'string' && url.includes('/api/users')) {
        return Promise.resolve(mockResponse({ users: [] }));
      }
      // For all other requests, return Promise.resolve(mockResponse({}));
      return Promise.resolve(mockResponse({}));
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders all fields', () => {
    render(<CreateTaskForm />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CreateTaskForm />);
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });


  it('submits with valid data (mocked API)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'mockid', title: 'Test' }) });
    render(<CreateTaskForm />);
    await fillAndSubmitCreateTaskForm({ title: 'Test Task', status: 'Pending' });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows error on failed API (mocked)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Failed to create' }) });
    render(<CreateTaskForm />);
    await fillAndSubmitCreateTaskForm({ title: 'Test Task', status: 'Pending' });
    expect(await screen.findByText(/failed to create/i)).toBeInTheDocument();
  });
});
