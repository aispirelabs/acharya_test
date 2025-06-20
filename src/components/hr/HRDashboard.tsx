
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getHRAnalytics, getHRInterviews } from '@/lib/api';
import CreateHRInterviewModal from './CreateHRInterviewModal';
import { 
  UsersIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface Analytics {
  total_interviews: number;
  total_candidates: number;
  completed_interviews: number;
  average_score: number;
  completion_rate: number;
  active_interviews: number;
  monthly_growth: number;
  recent_interviews: any[];
  popular_roles: { role: string; count: number }[];
}

export default function HRDashboard() {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsData, interviewsData] = await Promise.all([
        getHRAnalytics(),
        getHRInterviews()
      ]);
      setAnalytics(analyticsData);
      setInterviews(interviewsData.results);
    } catch (err: any) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewCreated = () => {
    fetchData();
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Acharya AI - HR Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="text-sm text-gray-300">Welcome,</span>
                <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400">{user?.company}</p>
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
            HR Analytics Dashboard
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Manage interviews, track candidate performance, and analyze hiring metrics
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <BriefcaseIcon className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Interviews</p>
                <p className="text-2xl font-bold text-white">{analytics?.total_interviews || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Candidates</p>
                <p className="text-2xl font-bold text-white">{analytics?.total_candidates || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Average Score</p>
                <p className="text-2xl font-bold text-white">{analytics?.average_score || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-orange-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Completion Rate</p>
                <p className="text-2xl font-bold text-white">{analytics?.completion_rate || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Completed Interviews</p>
                <p className="text-2xl font-bold text-white">{analytics?.completed_interviews || 0}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Active Interviews</p>
                <p className="text-2xl font-bold text-white">{analytics?.active_interviews || 0}</p>
              </div>
              <EyeIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Monthly Growth</p>
                <p className="text-2xl font-bold text-white">{analytics?.monthly_growth || 0}%</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Interview
          </button>
        </div>

        {/* Recent Interviews and Popular Roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Interviews */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-xl font-semibold text-white">Recent Interviews</h3>
            </div>
            <div className="p-6">
              {analytics?.recent_interviews?.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No interviews created yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.recent_interviews?.slice(0, 5).map((interview: any) => (
                    <div key={interview.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{interview.title || interview.role}</p>
                        <p className="text-sm text-gray-400">{interview.role} • {interview.level}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Popular Roles */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-xl font-semibold text-white">Popular Roles</h3>
            </div>
            <div className="p-6">
              {analytics?.popular_roles?.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No data available</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.popular_roles?.map((role: any, index: number) => (
                    <div key={role.role} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <span className="text-white font-medium">{role.role}</span>
                      </div>
                      <span className="text-gray-400 text-sm">{role.count} interviews</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Interview Modal */}
      {showCreateModal && (
        <CreateHRInterviewModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleInterviewCreated}
        />
      )}
    </div>
  );
}
