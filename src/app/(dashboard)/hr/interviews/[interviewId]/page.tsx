'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Define interfaces
interface FeedbackUser {
  id: string;
  email: string;
  first_name?: string | null; // Ensure it can be null from backend
  last_name?: string | null;  // Ensure it can be null from backend
}

interface FeedbackDetail {
  id: string; // Feedback ID
  user: FeedbackUser;
  total_score: number | null; // Can be null if not processed
  category_scores: any;
  strengths: string[] | null; // Can be null
  areas_for_improvement: string[] | null; // Can be null
  final_assessment: string | null; // Can be null
  created_at: string;
  session_status: string; // e.g., 'completed', 'in_progress'
  // interview field is part of FeedbackSerializer on backend, linking to InterviewFeedbackContextSerializer
  // We can assume it's available if needed, but for this display, direct fields are used.
  // interview: { id: string; }; // Parent interview ID
}

interface HRInterviewDetail {
  id: string;
  role: string;
  type: string;
  level: string;
  created_at: string;
  candidate_emails: string[];
  show_feedback_to_candidate: boolean;
  attempt_limit: number;
  techstack: string[];
  job_description?: string | null; // Can be null
  questions?: Array<{ id: string | number; text: string }>; // Assuming structure
  feedbacks: FeedbackDetail[];
  // Other fields from HRInterviewSerializer
  is_hr_created: boolean;
  hr_creator: { id: string; email: string; } | string; // Simplified hr_creator for now
}

export default function HRInterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  const [interview, setInterview] = useState<HRInterviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmails, setNewEmails] = useState('');
  const [addEmailsError, setAddEmailsError] = useState<string | null>(null);
  const [isSubmittingEmails, setIsSubmittingEmails] = useState(false);


  useEffect(() => {
    if (!interviewId) {
        setError("Interview ID is missing from the URL.");
        setIsLoading(false);
        return;
    }
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError("Authentication required. Redirecting...");
        router.push('/signin');
        return;
      }

      try {
        const response = await fetch(`/api/acharya_ai/hr/interviews/${interviewId}/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          setError("Session expired or unauthorized. Redirecting...");
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          router.push('/signin');
          return;
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch interview details. Status: ${response.status}`);
        }
        const data: HRInterviewDetail = await response.json();
        // Ensure techstack and candidate_emails are always arrays
        data.techstack = Array.isArray(data.techstack) ? data.techstack : [];
        data.candidate_emails = Array.isArray(data.candidate_emails) ? data.candidate_emails : [];
        data.feedbacks = Array.isArray(data.feedbacks) ? data.feedbacks : [];
        setInterview(data);
      } catch (e: any) {
        setError(e.message || "An unknown error occurred.");
        console.error("Fetch details error:", e);
      }
      finally { setIsLoading(false); }
    };
    fetchDetails();
  }, [interviewId, router]);

  const handleAddCandidates = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddEmailsError(null);
    setIsSubmittingEmails(true);

    if (!newEmails.trim() || !interview) {
        setAddEmailsError("Email input is empty or interview data is not loaded.");
        setIsSubmittingEmails(false);
        return;
    }

    const existingEmails = interview.candidate_emails || [];
    const emailsToAdd = newEmails.split(',')
                                 .map(e => e.trim().toLowerCase()) // Normalize to lowercase
                                 .filter(e => e && /\S+@\S+\.\S+/.test(e)); // Basic email validation

    const uniqueNewEmails = emailsToAdd.filter(e => !existingEmails.includes(e));

    if (uniqueNewEmails.length === 0) {
      setAddEmailsError("No new valid emails to add, or all provided emails are already invited.");
      setIsSubmittingEmails(false);
      setNewEmails(''); // Clear input as emails were processed
      return;
    }
    const updatedEmails = [...existingEmails, ...uniqueNewEmails];

    const token = localStorage.getItem('accessToken');
    if (!token) {
        setAddEmailsError("Authentication required. Please sign in again.");
        router.push('/signin');
        setIsSubmittingEmails(false);
        return;
    }

    try {
      const response = await fetch(`/api/acharya_ai/hr/interviews/${interviewId}/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_emails: updatedEmails }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to add candidates. Status: ${response.status}`);
      }
      const updatedInterview: HRInterviewDetail = await response.json();
       // Ensure techstack and candidate_emails are always arrays after update
       updatedInterview.techstack = Array.isArray(updatedInterview.techstack) ? updatedInterview.techstack : [];
       updatedInterview.candidate_emails = Array.isArray(updatedInterview.candidate_emails) ? updatedInterview.candidate_emails : [];
       updatedInterview.feedbacks = Array.isArray(updatedInterview.feedbacks) ? updatedInterview.feedbacks : [];
      setInterview(updatedInterview);
      setNewEmails('');
    } catch (e: any) {
        setAddEmailsError(e.message || "An unknown error occurred while adding candidates.");
        console.error("Add candidates error:", e);
    } finally {
        setIsSubmittingEmails(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="ml-4 text-lg text-gray-700 mt-4">Loading Interview Details...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-12 bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-red-700 mb-3">Error Loading Interview</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link href="/hr/interviews" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow hover:shadow-md transition-colors">
          Back to All Interviews
        </Link>
    </div>
  );

  if (!interview) return (
    <div className="text-center py-12 bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Interview Not Found</h2>
        <p className="text-gray-600 mb-6">The requested interview could not be found.</p>
        <Link href="/hr/interviews" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow hover:shadow-md transition-colors">
            Back to All Interviews
        </Link>
    </div>
  );

  // Map feedbacks to candidates for easier lookup
  const candidateFeedbackMap = new Map<string, FeedbackDetail[]>();
  if (interview.feedbacks) {
    interview.feedbacks.forEach(fb => {
      if (fb.user?.email) { // Ensure user and email exist
        const existing = candidateFeedbackMap.get(fb.user.email) || [];
        candidateFeedbackMap.set(fb.user.email, [...existing, fb]);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="mb-6 pb-2 border-b border-gray-200">
        <Link href="/hr/interviews" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Back to All Interviews
        </Link>
        <h1 className="text-3xl font-bold mt-1 text-gray-800">{interview.role}</h1>
        <p className="text-sm text-gray-500">Created: {new Date(interview.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Interview Details Section */}
          <section className="bg-white p-6 shadow-xl rounded-xl">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">Interview Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><strong className="text-gray-600">Level:</strong> <span className="text-gray-800">{interview.level}</span></div>
              <div><strong className="text-gray-600">Type:</strong> <span className="text-gray-800">{interview.type}</span></div>
              <div><strong className="text-gray-600">Attempt Limit:</strong> <span className="text-gray-800">{interview.attempt_limit}</span></div>
              <div><strong className="text-gray-600">Feedback Visibility:</strong>
                <span className={`ml-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${interview.show_feedback_to_candidate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {interview.show_feedback_to_candidate ? 'Visible to Candidate' : 'Hidden from Candidate'}
                </span>
              </div>
              {interview.techstack?.length > 0 && <div className="md:col-span-2"><strong className="text-gray-600">Tech Stack:</strong> <span className="text-gray-800">{interview.techstack.join(', ')}</span></div>}
              {interview.job_description && <div className="md:col-span-2"><strong className="text-gray-600">Job Description:</strong> <p className="text-gray-800 mt-1 whitespace-pre-wrap">{interview.job_description}</p></div>}
              {interview.questions && interview.questions.length > 0 && (
                <div className="md:col-span-2">
                  <strong className="text-gray-600">Questions ({interview.questions.length}):</strong>
                  <ul className="list-decimal list-inside mt-1 space-y-1 text-gray-800 max-h-40 overflow-y-auto pr-2">
                    {interview.questions.map(q => <li key={q.id || q.text} className="truncate" title={q.text}>{q.text}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Add More Candidates Section */}
          <section className="bg-white p-6 shadow-xl rounded-xl">
            <h2 className="text-xl font-semibold text-gray-700 mb-3 pb-2 border-b">Invite More Candidates</h2>
            <form onSubmit={handleAddCandidates} className="space-y-3">
              <div>
                <label htmlFor="newEmails" className="block text-sm font-medium text-gray-700">Add Emails (comma-separated):</label>
                <textarea id="newEmails" value={newEmails} onChange={(e) => setNewEmails(e.target.value)} rows={3}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="new.candidate1@example.com, another.email@example.com" />
              </div>
              {addEmailsError && <p className="text-red-500 text-xs italic">{addEmailsError}</p>}
              <button type="submit"
                      className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 transition-colors"
                      disabled={isSubmittingEmails || !newEmails.trim()}>
                {isSubmittingEmails ? 'Adding...' : 'Add & Invite Candidates'}
              </button>
            </form>
          </section>
        </div>

        {/* Invited Candidates & Feedback Summary Section */}
        <aside className="lg:col-span-1 space-y-6">
            <section className="bg-white p-6 shadow-xl rounded-xl">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">Candidate Status ({interview.candidate_emails?.length || 0} Invited)</h2>
                {interview.candidate_emails?.length > 0 ? (
                <ul className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto pr-2">
                    {interview.candidate_emails.map(email => {
                    const feedbacksForEmail = candidateFeedbackMap.get(email.toLowerCase()) || []; // Normalize email for lookup
                    const attemptsCount = feedbacksForEmail.length;
                    return (
                        <li key={email} className="py-3.5">
                        <p className="font-medium text-gray-800 text-sm">{email}</p>
                        <p className={`text-xs mt-0.5 ${attemptsCount > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                            Status: {attemptsCount > 0 ? `Attempted (${attemptsCount} time${attemptsCount > 1 ? 's' : ''})` : 'Invited - Pending'}
                        </p>
                        {attemptsCount > 0 && (
                            <div className="mt-1.5 space-y-1">
                            {feedbacksForEmail.map(fb => (
                                <div key={fb.id} className="text-xs p-2 bg-slate-50 rounded-md my-1 shadow-sm">
                                    Attempt on {new Date(fb.created_at).toLocaleDateString()}:
                                    {fb.session_status === 'completed' && fb.total_score !== null && typeof fb.total_score !== 'undefined' && (
                                    <span className="font-semibold ml-1 text-green-700">Score: {fb.total_score}/100</span>
                                    )}
                                    {fb.session_status === 'completed' ? (
                                    <Link href={`/candidate/interviews/${interview.id}/feedback/${fb.id}`} legacyBehavior>
                                        <a className="ml-2 text-indigo-600 hover:text-indigo-800 font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
                                            View Full Report
                                        </a>
                                    </Link>
                                    ) : (
                                    <span className="ml-2 text-gray-500 italic">({fb.session_status || 'Status unavailable'})</span>
                                    )}
                                </div>
                            ))}
                            </div>
                        )}
                        </li>
                    );
                    })}
                </ul>
                ) : <p className="text-gray-500 text-sm italic">No candidates have been invited to this interview yet.</p>}
            </section>
        </aside>
      </div>
    </div>
  );
}
