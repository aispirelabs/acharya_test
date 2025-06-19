'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Define interfaces
interface UserFeedbackContext {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  user_type?: string;
}

interface InterviewFeedbackContext {
  id: string; // This is the interview_id
  role: string;
  type?: string;
  level?: string;
  is_hr_created?: boolean;
  show_feedback_to_candidate?: boolean;
}

interface CategoryScore {
  name: string;
  score: number; // Assuming score is out of 10 from the mock data, adjust if different
  comment: string;
}

interface FeedbackDisplayData {
  id: string; // This is the feedback_id
  user: UserFeedbackContext;
  interview: InterviewFeedbackContext;
  total_score: number | null;
  category_scores: CategoryScore[] | null;
  strengths: string[] | null;
  areas_for_improvement: string[] | null;
  final_assessment: string | null;
  created_at: string; // Timestamp of feedback generation/completion
  session_status: string; // e.g., 'completed', 'pending', 'started'
  // questions_log and answers_log could be added if needed for display
}

export default function CandidateFeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const feedbackId = params.feedbackId as string;
  const interviewId = params.interviewId as string; // For "Back to Interview" link

  const [feedbackData, setFeedbackData] = useState<FeedbackDisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feedbackId) {
      setError("Feedback ID not found in URL.");
      setIsLoading(false);
      return;
    }

    const fetchFeedbackDetails = async () => {
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
        const response = await fetch(`/api/acharya_ai/feedback/${feedbackId}/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          setError('Session expired or unauthorized to view this feedback. Redirecting to sign in...');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          router.push('/signin');
          setIsLoading(false);
          return;
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to fetch feedback. Status: ${response.status}`);
        }
        const data: FeedbackDisplayData = await response.json();
        setFeedbackData(data);
      } catch (e: any) {
        setError(e.message || "An unknown error occurred while fetching feedback.");
        console.error("Fetch feedback details error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbackDetails();
  }, [feedbackId, router]);

  if (isLoading) {
    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            <p className="ml-4 text-lg text-gray-700 mt-4">Loading Feedback Report...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="text-center py-12 bg-white shadow-lg rounded-xl p-6 max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold text-red-700 mb-3">Error Loading Feedback</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/candidate/interviews" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow hover:shadow-md transition-colors">
            Back to My Interviews
            </Link>
        </div>
    );
  }

  if (!feedbackData) {
    return (
        <div className="text-center py-12 bg-white shadow-lg rounded-xl p-6 max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">Feedback Not Found</h2>
            <p className="text-gray-600 mb-6">The requested feedback could not be found or is not accessible.</p>
            <Link href="/candidate/interviews" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow hover:shadow-md transition-colors">
            Back to My Interviews
            </Link>
        </div>
    );
  }

  const isFeedbackProcessed = feedbackData.session_status === 'completed' && feedbackData.total_score !== null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-0"> {/* Removed p-0 for sm to allow full width card on mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Feedback Report: {feedbackData.interview.role}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
            Attempt on: {new Date(feedbackData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
        <Link href="/candidate/interviews" className="mt-3 sm:mt-0 text-sm text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Back to My Interviews
        </Link>
      </div>

      {!isFeedbackProcessed ? (
         <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-md shadow-md my-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-md font-semibold text-yellow-800">Feedback Processing</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This feedback is still being processed, or the interview session was not fully completed.
                  Please check back later. Current session status: <span className="font-medium">{feedbackData.session_status}</span>.
                </p>
              </div>
            </div>
          </div>
      ) : (
        <div className="space-y-6">
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 sm:p-8 shadow-xl rounded-xl text-center">
            <h2 className="text-xl font-semibold opacity-80 mb-1">Overall Interview Score</h2>
            <p className="text-6xl font-bold">
              {feedbackData.total_score !== null ? `${feedbackData.total_score}` : 'N/A'}
              <span className="text-3xl opacity-70">/100</span>
            </p>
          </section>

          {feedbackData.category_scores && feedbackData.category_scores.length > 0 && (
            <section className="bg-white p-6 shadow-xl rounded-xl">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 border-b pb-3">Category Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {feedbackData.category_scores.map((cat, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 md:last:border-b-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-md font-semibold text-gray-700">{cat.name}</h3>
                      <p className="text-lg font-bold text-indigo-600">{cat.score}/10</p>
                    </div>
                    <p className="text-sm text-gray-600">{cat.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(feedbackData.strengths && feedbackData.strengths.length > 0) || (feedbackData.areas_for_improvement && feedbackData.areas_for_improvement.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feedbackData.strengths && feedbackData.strengths.length > 0 && (
                <section className="bg-white p-6 shadow-xl rounded-xl">
                  <h2 className="text-xl font-semibold text-green-600 mb-4">Key Strengths</h2>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-700 text-sm">
                    {feedbackData.strengths.map((strength, index) => <li key={index}>{strength}</li>)}
                  </ul>
                </section>
              )}
              {feedbackData.areas_for_improvement && feedbackData.areas_for_improvement.length > 0 && (
                <section className="bg-white p-6 shadow-xl rounded-xl">
                  <h2 className="text-xl font-semibold text-yellow-600 mb-4">Areas for Improvement</h2>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-700 text-sm">
                    {feedbackData.areas_for_improvement.map((area, index) => <li key={index}>{area}</li>)}
                  </ul>
                </section>
              )}
            </div>
          ) : null}

          {feedbackData.final_assessment && (
            <section className="bg-white p-6 shadow-xl rounded-xl">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Final Assessment</h2>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{feedbackData.final_assessment}</p>
            </section>
          )}
        </div>
      )}
       <div className="mt-10 text-center">
          <Link href={`/candidate/interviews/${interviewId}`} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
            &larr; Back to Interview Session Details (if applicable)
          </Link>
       </div>
    </div>
  );
}
