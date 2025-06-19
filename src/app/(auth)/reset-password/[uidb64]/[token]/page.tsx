'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation'; // useParams to get URL params

export default function ResetPasswordConfirmPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();
  const params = useParams(); // Hook to get dynamic route parameters

  // Extract uidb64 and token. Ensure they are strings.
  const uidb64 = typeof params.uidb64 === 'string' ? params.uidb64 : '';
  const token = typeof params.token === 'string' ? params.token : '';

  useEffect(() => {
    if (!uidb64 || !token) {
      setError("Missing required parameters (UID or Token) from the URL to reset password.");
      // Optionally disable form or redirect if params are critical and missing on load
    }
  }, [uidb64, token]);


  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long.';
    }
    if (!confirmPassword) { // Added check for confirmPassword presence
        newErrors.confirmPassword = 'Confirm password is required.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({}); // Clear previous field errors

    if (!validateForm()) {
      return;
    }

    if (!uidb64 || !token) {
        setError("Cannot submit: Critical reset parameters (UID or Token) are missing from the URL.");
        return;
    }

    try {
      const response = await fetch('/api/users/password-reset/confirm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uidb64, token, new_password: newPassword }),
      });

      const data = await response.json().catch(() => ({})); // Gracefully handle non-JSON/empty responses

      if (response.ok) {
        setSuccessMessage(data.message || 'Your password has been reset successfully! Redirecting to sign-in...');
        // Disable form fields after success
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          router.push('/signin');
        }, 3000); // Delay for message visibility
      } else {
        if (data.new_password && Array.isArray(data.new_password)) { // Handle DRF validation errors for password
            setFieldErrors(prev => ({...prev, newPassword: data.new_password.join(' ')}));
        } else if (data.detail) {
            setError(data.detail);
        } else if (data.error) { // Generic error from backend
            setError(data.error);
        }
        else {
          setError('Failed to reset password. The link may be invalid, expired, or the password does not meet criteria.');
        }
      }
    } catch (err) {
      setError('Failed to connect to the server. Please check your network connection.');
      console.error('Reset password confirm error:', err);
    }
  };

  // Disable form if critical URL params are missing or after success
  const formDisabled = !uidb64 || !token || !!successMessage;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
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
          {successMessage && (
             <div className="rounded-md bg-green-50 p-4 mb-4">
               <div className="flex">
                 <div className="flex-shrink-0">
                   <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                   </svg>
                 </div>
                 <div className="ml-3">
                   <p className="text-sm font-medium text-green-800">{successMessage}</p>
                 </div>
               </div>
             </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="newPassword" className="sr-only">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.newPassword ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="New Password (min. 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.newPassword && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.newPassword}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-px`}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={formDisabled}
              />
              {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition duration-150 ease-in-out"
              disabled={formDisabled}
            >
              Reset Password
            </button>
          </div>
        </form>
        {!successMessage && (
            <p className="mt-4 text-center text-sm text-gray-600">
            Remembered your password or link invalid?{' '}
            <Link href="/signin" legacyBehavior>
                <a className="font-medium text-blue-600 hover:text-blue-500">
                Sign In
                </a>
            </Link>
            </p>
        )}
      </div>
    </main>
  );
}
