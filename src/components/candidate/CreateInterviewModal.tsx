"use client";

import { useState } from "react";
import { X, Upload, FileText } from "lucide-react";
import { createInterview } from "@/lib/api";
import { CreateInterviewRequest } from "@/lib/types";

interface CreateInterviewModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInterviewModal({ onClose, onSuccess }: CreateInterviewModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    role: '',
    type: 'technical' as 'technical' | 'behavioral' | 'mixed',
    level: 'entry' as 'entry' | 'mid' | 'senior' | 'lead',
    techstack: '',
    job_description: '',
    max_questions: 10,
    max_attempts: 3,
    time_limit: 60,
    show_feedback: true,
    candidate_emails: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_questions' || name === 'max_attempts' || name === 'time_limit' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const interviewData: CreateInterviewRequest = {
        title: formData.title,
        role: formData.role,
        type: formData.type,
        level: formData.level,
        techstack: formData.techstack.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0),
        job_description: formData.job_description,
        max_questions: formData.max_questions,
        max_attempts: formData.max_attempts,
        time_limit: formData.time_limit,
        show_feedback: formData.show_feedback,
        candidate_emails: formData.candidate_emails
      };

      await createInterview(interviewData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Create New Interview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Interview Title (Optional)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Frontend Developer Interview"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Position/Role *</label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Frontend Developer"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Interview Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead Level</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Interview Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tech Stack (comma-separated)</label>
            <input
              type="text"
              name="techstack"
              value={formData.techstack}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., React, TypeScript, Node.js"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Questions</label>
              <input
                type="number"
                name="max_questions"
                value={formData.max_questions}
                onChange={handleInputChange}
                min="5"
                max="50"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Attempts</label>
              <input
                type="number"
                name="max_attempts"
                value={formData.max_attempts}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (minutes)</label>
              <input
                type="number"
                name="time_limit"
                value={formData.time_limit}
                onChange={handleInputChange}
                min="15"
                max="180"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Description</label>
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the job requirements, responsibilities, and qualifications..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-slate-600 text-white rounded-lg hover:border-slate-500 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
