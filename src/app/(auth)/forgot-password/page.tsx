'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false); // To distinguish message type for styling
  const [fieldError, setFieldError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email) {
      setFieldError('Email is required.');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldError('Email is invalid.');
      return false;
    }
    setFieldError(null);
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsError(false);
    setFieldError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('/api/users/password-reset/request/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      // Backend is designed to return 200 OK (or similar success-like status)
      // even if email doesn't exist to prevent user enumeration.
      if (response.ok) {
        // The backend's RequestPasswordResetView always returns a generic success message.
        // We will display that message.
        const data = await response.json().catch(() => ({ message: 'If an account with that email exists, a password reset link has been sent. Please check your inbox (and spam folder).' }));
        setMessage(data.message || 'If an account with that email exists, a password reset link has been sent. Please check your inbox (and spam folder).');
        setIsError(false);
        setEmail(''); // Clear the email field on success
      } else {
        // Handle unexpected server errors
        const data = await response.json().catch(() => ({})); // Gracefully handle non-JSON responses
        setMessage(data.detail || data.error || data.message || 'An unexpected error occurred. Please try again.');
        setIsError(true);
      }
    } catch (err) {
      setMessage('Failed to connect to the server. Please check your network connection.');
      setIsError(true);
      console.error('Forgot password error:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot Your Password?
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address below, and if an account exists, we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white shadow-xl rounded-lg p-8" onSubmit={handleSubmit} noValidate>
          {message && (
            <div className={`rounded-md p-4 mb-4 ${isError ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {isError ? (
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${isError ? 'text-red-800' : 'text-green-800'}`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${fieldError ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldError && <p className="text-red-500 text-xs mt-1 px-1">{fieldError}</p>}
          </div>

          <div className="mt-6">
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">
              Send Reset Link
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Remembered your password?{' '}
          <Link href="/signin" legacyBehavior>
            <a className="font-medium text-blue-600 hover:text-blue-500">
              Sign In
            </a>
          </Link>
        </p>
      </div>
    </main>
  );
}
