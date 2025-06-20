
"use client";

import { useState } from "react";
import { X, Upload, Plus, Trash2, Mail, Eye, EyeOff } from "lucide-react";

interface CreateHRInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateHRInterviewModal({ isOpen, onClose }: CreateHRInterviewModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    position: '',
    level: 'entry',
    type: 'technical',
    numberOfQuestions: 5,
    jobDescription: '',
    showFeedback: true,
    maxAttempts: 1,
    timeLimit: 60
  });

  const [emails, setEmails] = useState<string[]>(['']);
  const [resume, setResume] = useState<File | null>(null);
  const [techStack, setTechStack] = useState<string[]>(['']);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmail = () => {
    setEmails([...emails, '']);
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const handleTechStackChange = (index: number, value: string) => {
    const newTechStack = [...techStack];
    newTechStack[index] = value;
    setTechStack(newTechStack);
  };

  const addTechStack = () => {
    setTechStack([...techStack, '']);
  };

  const removeTechStack = (index: number) => {
    if (techStack.length > 1) {
      setTechStack(techStack.filter((_, i) => i !== index));
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResume(file);
      // If resume is uploaded, only allow one email
      if (emails.length > 1) {
        setEmails([emails[0]]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emails.filter(email => email.trim() !== '');
    const validTechStack = techStack.filter(tech => tech.trim() !== '');
    
    const interviewData = {
      ...formData,
      emails: validEmails,
      techstack: validTechStack,
      resume: resume
    };
    
    console.log('Creating HR Interview:', interviewData);
    // Here you would typically send this data to your backend
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Create New Interview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Interview Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Senior React Developer Interview"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., React Developer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="mixed">Mixed (Technical + Behavioral)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Number of Questions</label>
              <input
                type="number"
                name="numberOfQuestions"
                value={formData.numberOfQuestions}
                onChange={handleInputChange}
                min="1"
                max="20"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (minutes)</label>
              <input
                type="number"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleInputChange}
                min="15"
                max="180"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tech Stack</label>
            <div className="space-y-2">
              {techStack.map((tech, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tech}
                    onChange={(e) => handleTechStackChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., React, Node.js, MongoDB"
                  />
                  {techStack.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTechStack(index)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTechStack}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Technology</span>
              </button>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Description</label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the role, responsibilities, and requirements..."
              required
            />
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Resume Upload (Optional)</label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors">
              <input
                type="file"
                onChange={handleResumeUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                {resume ? (
                  <div className="text-green-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">{resume.name}</p>
                    <p className="text-sm text-gray-400">Click to change</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Upload Resume Template</p>
                    <p className="text-sm">PDF, DOC, or DOCX up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
            {resume && (
              <p className="text-sm text-yellow-400 mt-2">
                When resume is uploaded, only one candidate email is allowed
              </p>
            )}
          </div>

          {/* Email Addresses */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Candidate Emails {resume && "(Limited to 1 when resume is uploaded)"}
            </label>
            <div className="space-y-2">
              {emails.map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="candidate@example.com"
                      required={index === 0}
                    />
                  </div>
                  {!resume && emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail(index)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {!resume && (
                <button
                  type="button"
                  onClick={addEmail}
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Email</span>
                </button>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Attempts</label>
              <input
                type="number"
                name="maxAttempts"
                value={formData.maxAttempts}
                onChange={handleInputChange}
                min="1"
                max="5"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showFeedback"
                  checked={formData.showFeedback}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-300">Show feedback to candidates</span>
              </label>
              {formData.showFeedback ? (
                <Eye className="w-4 h-4 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
            >
              Create Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
