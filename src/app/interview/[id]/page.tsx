'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getInterviewDetail } from '@/lib/api';
import { Interview } from '@/lib/types';
import { ROUTES } from '@/lib/constants';
import { 
  ArrowLeftIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function InterviewDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchInterviewDetails();
    }
  }, [id]);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      const data = await getInterviewDetail(id as string);
      setInterview(data);
    } catch (err: any) {
      setError('Failed to fetch interview details');
      console.error('Error fetching interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    router.push(`/interview/${id}/start`);
  };

  const handleBackToDashboard = () => {
    router.push(ROUTES.DASHBOARD);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Interview not found'}</p>
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-white">{interview.title || interview.role}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="text-sm text-gray-300">Welcome back,</span>
                <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interview Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Details Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Interview Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-300">Position</p>
                      <p className="text-white font-medium">{interview.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Type</p>
                      <p className="text-white font-medium capitalize">{interview.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Level</p>
                      <p className="text-white font-medium capitalize">{interview.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Tech Stack</p>
                      <p className="text-white font-medium">{Array.isArray(interview.techstack) ? interview.techstack.join(', ') : interview.techstack}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Interview Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-300">Max Questions</p>
                      <p className="text-white font-medium">{interview.max_questions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Max Attempts</p>
                      <p className="text-white font-medium">{interview.max_attempts}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Time Limit</p>
                      <p className="text-white font-medium">{interview.time_limit} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Feedback</p>
                      <p className="text-white font-medium">{interview.show_feedback ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {interview.job_description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Job Description</h3>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{interview.job_description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Start Interview Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-4">Ready to Start?</h3>
                <p className="text-gray-300 mb-6">
                  This interview will test your knowledge and skills. Make sure you're in a quiet environment and have enough time to complete it.
                </p>
                <button
                  onClick={handleStartInterview}
                  className="flex items-center justify-center mx-auto px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Start Interview
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-blue-400 mr-2" />
                    <span className="text-gray-300">Attempts</span>
                  </div>
                  <span className="text-white font-semibold">{interview.feedbacks?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-gray-300">Best Score</span>
                  </div>
                  <span className="text-white font-semibold">
                    {interview.feedbacks && interview.feedbacks.length > 0
                      ? Math.max(...interview.feedbacks.map(f => f.total_score))
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-purple-400 mr-2" />
                    <span className="text-gray-300">Created</span>
                  </div>
                  <span className="text-white font-semibold">
                    {new Date(interview.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(ROUTES.DASHBOARD)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <BriefcaseIcon className="h-4 w-4 mr-2" />
                  View All Interviews
                </button>
                <button
                  onClick={() => router.push(ROUTES.DASHBOARD)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  My Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 