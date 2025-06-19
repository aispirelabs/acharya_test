'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For potential redirect on auth error

// Define interfaces
interface FeedbackSummary {
  id: string;
  created_at: string;
  total_score?: number | null; // Can be null if not processed
  session_status?: string; // e.g., 'completed', 'in_progress'
}
interface Interview {
  id: string;
  role: string;
  type: string;
  level: string;
  created_at: string;
  techstack: string[]; // Expecting an array of strings from the backend
  feedbacks: FeedbackSummary[];
  // Add other fields like cover_image if needed for display
  cover_image?: string | null;
}

export default function MyInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInterviews = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication token not found. Please sign in.');
        // Redirect to signin after a short delay or immediately
        // setTimeout(() => router.push('/signin'), 2000);
        router.push('/signin');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/acharya_ai/interviews/', { // Endpoint for listing user's interviews
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json', // Good practice, though GET might not strictly need it
          },
        });

        if (response.status === 401 || response.status === 403) {
          setError('Your session has expired or is invalid. Please sign in again.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          router.push('/signin');
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Graceful handling of non-JSON error response
          throw new Error(errorData.detail || `Failed to fetch interviews. Status: ${response.status}`);
        }

        const data: Interview[] = await response.json();
        // Ensure techstack is always an array, even if null/undefined from API (though backend should send array)
        const processedData = data.map(interview => ({
            ...interview,
            techstack: Array.isArray(interview.techstack) ? interview.techstack : (interview.techstack ? [String(interview.techstack)] : [])
        }));
        setInterviews(processedData);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while fetching your interviews.');
        console.error("Fetch interviews error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviews();
  }, [router]); // router is a dependency for programmatic navigation

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-700">Loading your interviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
        <p className="text-red-500 text-lg mb-6">{error}</p>
        <button
            onClick={() => router.push('/candidate')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
            Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">My Interviews</h1>
            <p className="mt-1 text-sm text-gray-500">Review your past practice interviews and their feedback.</p>
        </div>
        <Link href="/candidate" passHref legacyBehavior>
            <a className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out text-sm inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Interview
            </a>
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-16 bg-white shadow-lg rounded-xl p-8">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Interviews Yet</h2>
          <p className="text-gray-500 mb-6">It looks like you haven&apos;t created any practice interviews. <br/>Click the button above to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-8">
          {interviews.map((interview) => (
            <Link key={interview.id} href={`/candidate/interviews/${interview.id}`} passHref legacyBehavior>
              <a className="block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden group transform hover:-translate-y-1">
                {interview.cover_image && (
                    <div className="w-full h-40 overflow-hidden">
                        <img src={interview.cover_image} alt={`${interview.role} cover`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                    </div>
                )}
                <div className="p-5">
                    <h2 className="text-lg font-semibold text-blue-700 mb-1.5 truncate group-hover:text-blue-800">{interview.role}</h2>
                    <p className="text-xs text-gray-500 mb-2">
                      Created: {new Date(interview.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="space-y-1 text-sm mb-3">
                        <p className="text-gray-600"><span className="font-medium text-gray-800">Level:</span> {interview.level}</p>
                        <p className="text-gray-600"><span className="font-medium text-gray-800">Type:</span> {interview.type}</p>
                        <p className="text-gray-600 truncate" title={interview.techstack.join(', ')}>
                            <span className="font-medium text-gray-800">Tech:</span>
                            {interview.techstack && interview.techstack.length > 0 ? (
                                <span className="ml-1">{interview.techstack.join(', ')}</span>
                            ) : (
                                <span className="ml-1 text-gray-400 italic">N/A</span>
                            )}
                        </p>
                    </div>
                    {/* Original Attempts count - can be removed or kept if distinct from detailed feedback list */}
                    {/* <div className="border-t border-gray-100 pt-3">
                        <p className="text-sm text-gray-700"><span className="font-medium">Attempts:</span> {interview.feedbacks?.length || 0}</p>
                    </div> */}

                    {/* New section for Attempts & Feedback */}
                    <div className="border-t border-gray-100 pt-3 mt-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Feedback Reports:</h4>
                        {interview.feedbacks && interview.feedbacks.length > 0 ? (
                        <ul className="space-y-1.5">
                            {interview.feedbacks.map((fb_summary, index) => (
                            <li key={fb_summary.id} className="text-xs text-gray-600">
                                <div className="flex justify-between items-center">
                                    <span>
                                        Attempt {index + 1} ({new Date(fb_summary.created_at).toLocaleDateString()})
                                        {fb_summary.session_status === 'completed' && fb_summary.total_score !== null && typeof fb_summary.total_score !== 'undefined' && (
                                        <span className="font-semibold ml-1 text-green-700">Score: {fb_summary.total_score}/100</span>
                                        )}
                                    </span>
                                    {fb_summary.session_status === 'completed' ? (
                                        <Link href={`/candidate/interviews/${interview.id}/feedback/${fb_summary.id}`} legacyBehavior>
                                        <a className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline">View Report</a>
                                        </Link>
                                    ) : (
                                        <span className="text-gray-400 italic">({fb_summary.session_status || 'Processing...'})</span>
                                    )}
                                </div>
                            </li>
                            ))}
                        </ul>
                        ) : (
                        <p className="text-xs text-gray-500 italic">No feedback reports available yet.</p>
                        )}
                    </div>

                    <div className="mt-4 text-right">
                        {/* This link now primarily serves to go to the interview practice/taking page */}
                        <span className="inline-flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
                            Practice Interview &rarr;
                        </span>
                    </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
