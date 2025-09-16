
import { screen, fireEvent } from '@testing-library/react';

/**
 * Helper to fill and submit the CreateTaskForm for tests.
 */
export async function fillAndSubmitCreateTaskForm({ title, status = 'Pending', dueDate }: { title: string; status?: string; dueDate?: string }) {
	if (title !== undefined) fireEvent.change(screen.getByLabelText(/title/i), { target: { value: title } });
	if (status !== undefined) fireEvent.change(screen.getByLabelText(/status/i), { target: { value: status } });
	if (dueDate !== undefined) fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: dueDate } });
	fireEvent.click(screen.getByRole('button', { name: /create/i }));
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
