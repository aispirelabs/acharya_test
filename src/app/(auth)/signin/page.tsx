'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SigninPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({}); // Clear previous field errors

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('/api/users/login/', { // Django backend uses 'username' by default for EmailBackend too
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Ensure the body matches what the backend EmailBackend expects: 'username' (which is email) and 'password'
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Backend is expected to return: access, refresh, and user details (email, user_type, first_name, last_name)
        // This matches the custom LoginView response structure we have in users/views.py
        if (data.access && data.refresh && data.user && data.user.user_type) {
          localStorage.setItem('accessToken', data.access);
          localStorage.setItem('refreshToken', data.refresh);
          localStorage.setItem('userData', JSON.stringify({
            email: data.user.email,
            user_type: data.user.user_type,
            first_name: data.user.first_name,
            last_name: data.user.last_name,
            id: data.user.id // Storing user ID might be useful
          }));

          if (data.user.user_type === 'hr') {
            router.push('/hr'); // Redirect to HR dashboard
          } else {
            router.push('/candidate'); // Redirect to Candidate dashboard
          }
        } else {
          setError('Login successful, but essential user data or tokens are missing in the response.');
        }
      } else {
         // Use error message from backend if available, otherwise a generic one
        if (data.detail) {
          setError(data.detail);
        } else if (data.error) { // Some backends might use 'error'
          setError(data.error);
        } else if (typeof data === 'object' && data !== null) {
            // If 'data' is an object with field errors (e.g., from DRF validation)
            let backendErrorMessages = "";
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    backendErrorMessages += `${key}: ${data[key].join(', ')} `;
                } else {
                    backendErrorMessages += `${key}: ${data[key]} `;
                }
            }
            setError(backendErrorMessages.trim() || 'Invalid email or password.');
        }
        else {
          setError('Invalid email or password.');
        }
      }
    } catch (err) {
      setError('Failed to connect to the server. Please check your network connection.');
      console.error('Login submission error:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign In to Acharya AI
          </h1>
        </div>
        <form className="mt-8 space-y-6 bg-white shadow-xl rounded-lg p-8" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-px`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.password}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end mt-2">
            <div className="text-sm">
              <Link href="/forgot-password" legacyBehavior>
                <a className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">
              Sign In
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          New to Acharya AI?{' '}
          <Link href="/signup" legacyBehavior>
            <a className="font-medium text-blue-600 hover:text-blue-500">
              Create an account
            </a>
          </Link>
        </p>
      </div>
    </main>
  );
}
