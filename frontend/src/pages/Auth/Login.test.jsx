import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Login from './Login';

// Mock mutations hook
const mockLoginMutate = vi.fn();
const mockGoogleLoginMutate = vi.fn();

vi.mock('../../features/auth/hooks/useAuthMutations', () => ({
  useLoginMutation: () => ({
    mutate: mockLoginMutate,
    isPending: false,
  }),
  useGoogleLoginMutation: () => ({
    mutate: mockGoogleLoginMutate,
    isPending: false,
  }),
}));

// Mock router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form items', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('shows error messages on invalid input submission', async () => {
    render(<Login />);
    
    const submitBtn = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows invalid email message for bad email address', async () => {
    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'bademail' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('submits form data and calls login mutation', async () => {
    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'correctpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLoginMutate).toHaveBeenCalledWith(
        { email: 'test@gmail.com', password: 'correctpassword' },
        expect.any(Object)
      );
    });
  });
});
