'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getInterviewDetail } from '@/lib/api';
import { Interview } from '@/lib/types';
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

interface FeedbackCategory {
  score: number;
  strengths: string[];
  improvements: string[];
}

interface InterviewFeedback {
  overallScore: number;
  categories: {
    technical: FeedbackCategory;
    communication: FeedbackCategory;
    problemSolving: FeedbackCategory;
  };
  summary: string;
  recommendations: string[];
}

function InterviewResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mock feedback data - in real implementation, this would come from the backend
  const [feedback] = useState<InterviewFeedback>({
    overallScore: 85,
    categories: {
      technical: {
        score: 80,
        strengths: ['Good problem-solving approach', 'Solid understanding of core concepts'],
        improvements: ['Could provide more detailed explanations', 'Consider edge cases more thoroughly']
      },
      communication: {
        score: 90,
        strengths: ['Clear and articulate responses', 'Good listening skills'],
        improvements: ['Could ask more clarifying questions', 'Provide more context in explanations']
      },
      problemSolving: {
        score: 85,
        strengths: ['Logical thinking process', 'Systematic approach to problems'],
        improvements: ['Could consider alternative solutions', 'Think about scalability more']
      }
    },
    summary: 'Strong technical foundation with excellent communication skills. The candidate demonstrates good problem-solving abilities and shows potential for growth in technical depth and solution optimization.',
    recommendations: [
      'Practice explaining complex technical concepts in detail',
      'Work on considering edge cases and alternative solutions',
      'Continue developing communication skills and asking clarifying questions',
      'Focus on scalability and performance optimization in problem-solving'
    ]
  });

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
                <p className="text-sm text-gray-300">Duration</p>
                <p className="text-white font-semibold">{interview.time_limit} minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Overall Score</h2>
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBgColor(feedback.overallScore)} mb-6`}>
              <span className={`text-4xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                {feedback.overallScore}%
              </span>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">{feedback.summary}</p>
          </div>
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(feedback.categories).map(([category, data]) => (
            <div key={category} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white capitalize">{category}</h3>
                <div className={`px-3 py-1 rounded-full border ${getScoreBgColor(data.score)}`}>
                  <span className={`text-sm font-semibold ${getScoreColor(data.score)}`}>
                    {data.score}%
                  </span>
                </div>
              </div>
              
              {/* Strengths */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {data.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-300">• {strength}</li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {data.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-gray-300">• {improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <StarIcon className="h-5 w-5 mr-2 text-yellow-400" />
            Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedback.recommendations.map((recommendation, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-300 text-sm">{recommendation}</p>
              </div>
            ))}
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
        </div>
      </div>
    </div>
  );
}

export default InterviewResultsPage; 