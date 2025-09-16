import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthForm from '../AuthForm';
import { fillAndSubmitAuthForm } from './testHelper';

describe('AuthForm', () => {
  it('renders login form by default', () => {
    render(<AuthForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('switches to register mode', () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('validates empty fields', async () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('shows error on invalid email', async () => {
    render(<AuthForm />);
    await fillAndSubmitAuthForm({ email: 'notanemail', password: 'Test1234!' });
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('submits login with valid credentials (mocked API)', async () => {
    // Mock fetch or axios here
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'mocktoken' }),
    });
    render(<AuthForm />);
    await fillAndSubmitAuthForm({ email: 'user@example.com', password: 'Test1234!' });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows error on failed login (mocked API)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });
    render(<AuthForm />);
    await fillAndSubmitAuthForm({ email: 'user@example.com', password: 'wrongpass' });
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
