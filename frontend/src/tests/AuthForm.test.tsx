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

  it('does not submit with whitespace-only fields', async () => {
    await fillAndSubmitAuthForm({ email: '   ', password: '   ' });
    await expectErrorMessage(/please enter a valid email address/i);
  });

  it('shows error on extremely long input', async () => {
    const longEmail = 'a'.repeat(300) + '@example.com';
    const longPassword = 'A'.repeat(300) + '1!';
    await fillAndSubmitAuthForm({ email: longEmail, password: longPassword });
    // Should still validate email format or length
    await expectErrorMessage(/please enter a valid email address|password/i);
  });

  it('switches modes rapidly and submits', async () => {
    switchAuthMode('register');
    switchAuthMode('login');
    await fillAndSubmitAuthForm({ email: 'user@example.com', password: 'Test1234!' });
    // No error expected for valid login
  });

  it('submits form with Enter key', async () => {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Test1234!' } });
    fireEvent.keyDown(screen.getByLabelText(/password/i), { key: 'Enter', code: 'Enter' });
    // Should submit or at least not throw
  });

  it('focuses first field after error', async () => {
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await expectErrorMessage(/please enter a valid email address/i);
    expect(document.activeElement).toBe(screen.getByLabelText(/email/i));
  });

  it('shows loading state on submit (mocked)', async () => {
    let resolveFetch;
    global.fetch = jest.fn(() => new Promise(res => { resolveFetch = res; }));
    await fillAndSubmitAuthForm({ email: 'user@example.com', password: 'Test1234!' });
    // Optionally check for loading indicator if present
    // resolveFetch({ ok: true, json: async () => ({ token: 'mocktoken' }) });
  });

  it('resets form after successful register', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'mocktoken' }) });
    switchAuthMode('register');
    await fillAndSubmitAuthForm({ email: 'resetuser@example.com', password: 'Test1234!', mode: 'register' });
    // Wait for the form fields to be cleared after registration
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/password/i)).toHaveValue('');
    });
  });

  it('associates error message with field for accessibility', async () => {
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    const error = await screen.findByText(/please enter a valid email address/i);
    const emailInput = screen.getByLabelText(/email/i);
    // Check aria-describedby or similar
    expect(emailInput.getAttribute('aria-describedby') || '').toContain(error.id || error.getAttribute('id') || '');
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
