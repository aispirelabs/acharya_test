'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getInterviewDetail, getInterviewFeedback } from '@/lib/api';
import { Interview, Feedback } from '@/lib/types';
import { ROUTES } from '@/lib/constants';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserIcon,
  BriefcaseIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';

function InterviewResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchInterviewData();
    }
  }, [id]);

  const fetchInterviewData = async () => {
    try {
      setLoading(true);
      const [interviewData, feedbackData] = await Promise.all([
        getInterviewDetail(id as string),
        getInterviewFeedback(id as string)
      ]);
      
      setInterview(interviewData);
      
      // Get the latest feedback
      if (feedbackData.results && feedbackData.results.length > 0) {
        setFeedback(feedbackData.results[0]);
      }
    } catch (err: any) {
      setError('Failed to fetch interview results');
      console.error('Error fetching interview data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push(ROUTES.DASHBOARD);
  };

  const handleViewInterview = () => {
    router.push(`/interview/${id}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500/50';
    if (score >= 80) return 'bg-blue-500/20 border-blue-500/50';
    if (score >= 70) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading results...</p>
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

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-yellow-400 text-lg mb-4">No feedback available yet</p>
          <p className="text-gray-300 mb-6">Feedback is being generated. Please check back in a few moments.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleBackToDashboard}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={fetchInterviewData}
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-white">Interview Results</h1>
            </div>
            <div className="text-white">
              <span className="text-sm text-gray-300">Candidate:</span>
              <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interview Info */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <BriefcaseIcon className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm text-gray-300">Position</p>
                <p className="text-white font-semibold">{interview.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <UserIcon className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-sm text-gray-300">Level</p>
                <p className="text-white font-semibold capitalize">{interview.level}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-sm text-gray-300">Type</p>
                <p className="text-white font-semibold capitalize">{interview.type}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-300">Attempt</p>
                <p className="text-white font-semibold">#{feedback.attempt_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Overall Score</h2>
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBgColor(feedback.total_score)} mb-6`}>
              <span className={`text-4xl font-bold ${getScoreColor(feedback.total_score)}`}>
                {feedback.total_score}%
              </span>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">{feedback.final_assessment}</p>
          </div>
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {feedback.category_scores.map((category, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                <div className={`px-3 py-1 rounded-full border ${getScoreBgColor(category.score)}`}>
                  <span className={`text-sm font-semibold ${getScoreColor(category.score)}`}>
                    {category.score}%
                  </span>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm">{category.comment}</p>
            </div>
          ))}
        </div>

        {/* Strengths and Areas for Improvement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
              Strengths
            </h3>
            <div className="space-y-3">
              {feedback.strengths.map((strength, index) => (
                <div key={index} className="bg-green-500/10 rounded-lg p-3">
                  <p className="text-green-200 text-sm">• {strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-400" />
              Areas for Improvement
            </h3>
            <div className="space-y-3">
              {feedback.areas_for_improvement.map((improvement, index) => (
                <div key={index} className="bg-yellow-500/10 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm">• {improvement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleBackToDashboard}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleViewInterview}
            className="px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-semibold"
          >
            View Interview Details
          </button>
          <button
            onClick={() => router.push(`/interview/${id}/start`)}
            className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            Retake Interview
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewResultsPage;