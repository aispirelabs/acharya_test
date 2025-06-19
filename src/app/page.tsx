import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Welcome to Acharya AI
        </h1>
        <p className="text-gray-600 mb-8">
          Your AI-powered partner for smarter interviewing. Acharya AI helps candidates practice and prepare, while offering HR professionals powerful tools to streamline the hiring process.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup" legacyBehavior>
            <a className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-150 ease-in-out w-full sm:w-auto">
              Sign Up
            </a>
          </Link>
          <Link href="/signin" legacyBehavior>
            <a className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-150 ease-in-out w-full sm:w-auto">
              Sign In
            </a>
          </Link>
        </div>
      </div>
    </main>
  );
}