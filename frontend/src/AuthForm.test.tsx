import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthForm from './AuthForm';

// Helper to fill and submit the AuthForm
async function fillAndSubmitAuthForm({ email, password, mode = 'login' }: { email: string; password: string; mode?: 'login' | 'register' }) {
  render(<AuthForm />);
  // Switch mode if needed
  if (mode === 'register') {
    const switchBtn = screen.getByRole('button', { name: /register/i });
    fireEvent.click(switchBtn);
  }
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(mode, 'i') }));
}

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
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows error on invalid email', async () => {
    await fillAndSubmitAuthForm({ email: 'notanemail', password: 'Test1234!' });
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('submits login with valid credentials (mocked API)', async () => {
    // Mock fetch or axios here
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'mocktoken' }),
    });
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
    await fillAndSubmitAuthForm({ email: 'user@example.com', password: 'wrongpass' });
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
