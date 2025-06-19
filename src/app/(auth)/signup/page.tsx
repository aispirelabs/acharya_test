'use client'; // Required for using hooks like useState, useRouter

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For redirection

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('candidate'); // 'candidate' or 'hr'
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName) newErrors.firstName = 'First name is required.';
    if (!lastName) newErrors.lastName = 'Last name is required.';
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid.';
    }
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.'; // Added length check
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!userType) newErrors.userType = 'User type is required.';

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous general errors

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('/api/users/register/', { // Ensure this matches your Django API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username: email, // Django's default User model needs a username. Email is a common choice.
          email: email,
          password: password,
          user_type: userType,
        }),
      });

      if (response.ok) {
        router.push('/signin'); // Redirect to sign-in page on successful registration
      } else {
        const data = await response.json();
        // Handle specific field errors from backend if available
        if (response.status === 400 && data) {
            let backendErrorMessages = "";
            // Check if data is an object and not a simple string error like "User already exists"
            if (typeof data === 'object' && data !== null) {
                for (const key in data) {
                    if (Array.isArray(data[key])) {
                        // Capitalize key and join array messages
                        backendErrorMessages += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${data[key].join(', ')}. `;
                    } else {
                         backendErrorMessages += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${data[key]}. `;
                    }
                }
            } else if (typeof data.detail === 'string') { // Handle cases like {"detail": "error message"}
                 backendErrorMessages = data.detail;
            } else if (typeof data === 'string') { // Handle plain string error
                 backendErrorMessages = data;
            } else {
                backendErrorMessages = 'Registration failed. Please check your input.';
            }
            setError(backendErrorMessages.trim());
        } else if (response.status === 500) {
            setError('Server error. Please try again later.');
        }
         else {
            setError(data.detail || 'An unexpected error occurred. Please try again.');
        }
      }
    } catch (err) {
      setError('Failed to connect to the server. Please check your network connection.');
      console.error('Registration submission error:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your Acharya AI Account
          </h1>
        </div>
        <form className="mt-8 space-y-6 bg-white shadow-xl rounded-lg p-8" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  {/* Heroicon name: mini/x-circle */}
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
              <label htmlFor="firstName" className="sr-only">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">Last Name</label>
              <input id="lastName" name="lastName" type="text" autoComplete="family-name" required className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${fieldErrors.firstName ? '' : 'mt-px'}`} placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.lastName}</p>}
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autoComplete="email" required className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-px`} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-px`} placeholder="Password (min. 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-px`} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 px-1">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="block text-sm font-medium text-gray-700 mb-1">I am a:</legend>
            <div className="mt-2 space-y-2 sm:flex sm:items-center sm:space-y-0 sm:space-x-6">
              <div className="flex items-center">
                <input id="candidate" name="userType" type="radio" value="candidate" checked={userType === 'candidate'} onChange={(e) => setUserType(e.target.value)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                <label htmlFor="candidate" className="ml-2 block text-sm text-gray-900">Candidate</label>
              </div>
              <div className="flex items-center">
                <input id="hr" name="userType" type="radio" value="hr" checked={userType === 'hr'} onChange={(e) => setUserType(e.target.value)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                <label htmlFor="hr" className="ml-2 block text-sm text-gray-900">HR Professional</label>
              </div>
            </div>
            {fieldErrors.userType && <p className="text-red-500 text-xs mt-1">{fieldErrors.userType}</p>}
          </fieldset>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">
              Create Account
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
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
