'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getInterviews } from '@/lib/api';
import CreateInterviewModal from './CreateInterviewModal';
import { Interview } from '@/lib/types';
import { ROUTES } from '@/lib/constants';
import { 
  BookOpenIcon,
  PlusIcon,
  ClockIcon,
  ChartBarIcon,
  UserIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllInterviews, setShowAllInterviews] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const data = await getInterviews();
      setInterviews(data);
    } catch (err: any) {
      setError('Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewCreated = () => {
    fetchInterviews();
    setShowCreateModal(false);
  };

  const handleInterviewClick = (interviewId: string) => {
    router.push(ROUTES.INTERVIEW(interviewId));
  };

  const getInterviewStats = () => {
    const totalInterviews = interviews.length;
    const totalAttempts = interviews.reduce((sum, interview) => sum + (interview.feedbacks?.length || 0), 0);
    const avgScore = interviews.reduce((sum, interview) => {
      const scores = interview.feedbacks?.map(f => f.total_score) || [];
      const avgInterviewScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return sum + avgInterviewScore;
    }, 0) / (totalInterviews || 1);

    return { totalInterviews, totalAttempts, avgScore: Math.round(avgScore) };
  };

  const stats = getInterviewStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Acharya AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="text-sm text-gray-300">Welcome back,</span>
                <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome to Your Interview Dashboard
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Practice and improve your interview skills with AI-powered assessments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <BriefcaseIcon className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Interviews</p>
                <p className="text-2xl font-bold text-white">{stats.totalInterviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Attempts</p>
                <p className="text-2xl font-bold text-white">{stats.totalAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Average Score</p>
                <p className="text-2xl font-bold text-white">{stats.avgScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Interview
          </button>
          
          <button 
            onClick={() => setShowAllInterviews(!showAllInterviews)}
            className="flex items-center justify-center px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
          >
            <BookOpenIcon className="h-5 w-5 mr-2" />
            {showAllInterviews ? 'Show Recent Interviews' : 'View All Interviews'}
          </button>
        </div>

        {/* Recent Interviews */}
        <div id="recent-interviews" className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-xl font-semibold text-white">
              {showAllInterviews ? 'All Interviews' : 'Recent Interviews'}
            </h3>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="text-gray-300 mt-2">Loading interviews...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400">{error}</p>
              </div>
            ) : interviews.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">No interviews yet</p>
                <p className="text-gray-400">Create your first interview to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(showAllInterviews ? interviews : interviews.slice(0, 6)).map((interview) => (
                  <div key={interview.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-colors cursor-pointer" onClick={() => handleInterviewClick(interview.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white truncate">{interview.title || interview.role}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        interview.level === 'entry' ? 'bg-green-500/20 text-green-200' :
                        interview.level === 'mid' ? 'bg-yellow-500/20 text-yellow-200' :
                        'bg-red-500/20 text-red-200'
                      }`}>
                        {interview.level}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-2">{interview.role}</p>
                    <p className="text-gray-400 text-xs mb-3">{interview.techstack}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{interview.feedbacks?.length || 0} attempts</span>
                      <span>{new Date(interview.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Interview Modal */}
      {showCreateModal && (
        <CreateInterviewModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleInterviewCreated}
        />
      )}
    </div>
  );
}
