'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define HRInterview interface
interface HRUserSummary {
    id: string;
    first_name?: string;
    email: string;
}

interface FeedbackSummary { // Re-added for consistency if feedbacks array is part of HRInterview directly
  id: string;
  created_at: string;
  total_score?: number;
}

interface HRInterview {
  id: string;
  role: string;
  type: string;
  level: string;
  created_at: string;
  candidate_emails: string[];
  show_feedback_to_candidate: boolean;
  attempt_limit: number;
  is_hr_created: boolean;
  hr_creator: HRUserSummary | string; // Depending on serializer depth
  feedbacks: FeedbackSummary[]; // Using the feedbacks array to count attempts for HR view
  techstack?: string[]; // Added as it's likely part of the interview details
  questions?: any[]; // Added as it's likely part of the interview details
}

export default function ManageInterviewsPage() {
  const [interviews, setInterviews] = useState<HRInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHRInterviews = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication required. Redirecting to sign in...');
        router.push('/signin');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/acharya_ai/hr/interviews/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          router.push('/signin');
          setError('Session expired or unauthorized. Please sign in again.');
          setIsLoading(false);
          return;
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to fetch interviews. Server status: ${response.status}`);
        }
        const data: HRInterview[] = await response.json();
        setInterviews(data);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while fetching interviews.');
        console.error("Fetch HR interviews error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHRInterviews();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="ml-4 text-lg text-gray-700 mt-4">Loading Scheduled Interviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-red-700 mb-3">Failed to Load Interviews</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
            onClick={() => router.push('/hr')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow hover:shadow-md transition-colors"
        >
          Back to HR Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Manage Scheduled Interviews</h1>
            <p className="mt-1 text-sm text-gray-500">Oversee and manage all interviews created by your HR team.</p>
        </div>
        <Link href="/hr" passHref legacyBehavior>
          <a className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out text-sm inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Schedule New Interview
          </a>
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-16 bg-white shadow-xl rounded-xl p-8">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Interviews Scheduled Yet</h2>
          <p className="text-gray-500 mb-6">Click the button above to schedule your first interview.</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidates</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {interviews.map((interview) => (
                <tr key={interview.id} className="hover:bg-indigo-50 transition-colors duration-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-indigo-700">{interview.role}</div>
                    <div className="text-xs text-gray-500">Created: {new Date(interview.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Level: {interview.level}</div>
                    <div>Type: {interview.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Invited: {interview.candidate_emails?.length || 0}</div>
                    {/* Placeholder for completed, actual attempts might come from feedback count */}
                    <div>Attempts: {interview.feedbacks?.length || 0} / {(interview.candidate_emails?.length || 0) * interview.attempt_limit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${interview.show_feedback_to_candidate ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      Feedback: {interview.show_feedback_to_candidate ? 'Visible' : 'Hidden'}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">Limit: {interview.attempt_limit} per candidate</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/hr/interviews/${interview.id}`} legacyBehavior>
                      <a className="text-indigo-600 hover:text-indigo-900 hover:underline">View Details</a>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
