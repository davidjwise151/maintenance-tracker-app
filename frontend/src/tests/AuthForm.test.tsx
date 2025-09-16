import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthForm from '../AuthForm';
import {
  fillAndSubmitAuthForm,
  switchAuthMode,
  expectErrorMessage
} from './testHelper';

describe('AuthForm', () => {
  beforeEach(() => {
    render(<AuthForm />);
  });

  it('renders login form by default', () => {
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('switches to register mode', () => {
    switchAuthMode('register');
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('validates empty fields', async () => {
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await expectErrorMessage(/please enter a valid email address/i);
  });

  it('shows error on invalid email', async () => {
    await fillAndSubmitAuthForm({ email: 'notanemail', password: 'Test1234!' });
    await expectErrorMessage(/please enter a valid email address/i);
  });

  it('submits login with valid credentials (mocked API)', async () => {
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
    await expectErrorMessage(/invalid credentials/i);
  });

  it('registers with valid credentials (mocked API)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'mocktoken' }),
    });
    switchAuthMode('register');
    await fillAndSubmitAuthForm({ email: 'newuser@example.com', password: 'Test1234!', mode: 'register' });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows error on weak password in register mode', async () => {
    switchAuthMode('register');
    await fillAndSubmitAuthForm({ email: 'newuser@example.com', password: '123', mode: 'register' });
    await expectErrorMessage(/password/i);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
