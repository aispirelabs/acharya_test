'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // For potential redirection on auth error

export default function HRCreateInterviewForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (newInterview: any) => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('Junior');
  const [type, setType] = useState('Technical');
  const [maxQuestions, setMaxQuestions] = useState(7);
  const [techstack, setTechstack] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [candidateEmails, setCandidateEmails] = useState('');
  const [showFeedback, setShowFeedback] = useState(true);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!role.trim()) newErrors.role = 'Position Name is required.';
    if (!level) newErrors.level = 'Interview Level is required.';
    if (!type) newErrors.type = 'Interview Type is required.';
    if (Number(maxQuestions) < 1) newErrors.maxQuestions = 'Number of questions must be at least 1.';
    if (Number(attemptLimit) < 1) newErrors.attemptLimit = 'Attempt limit must be at least 1.';

    // Validate candidate emails if provided
    if (candidateEmails.trim()) {
        const emailsArray = candidateEmails.split(',').map(s => s.trim()).filter(s => s);
        for (const email of emailsArray) {
            if (!/\S+@\S+\.\S+/.test(email)) {
                newErrors.candidateEmails = 'One or more candidate emails are invalid.';
                break;
            }
        }
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    const techstackArray = techstack.split(',').map(s => s.trim()).filter(s => s);
    const emailsArray = candidateEmails.split(',').map(s => s.trim()).filter(s => s);

    const payload = {
      role,
      level,
      type,
      max_questions: Number(maxQuestions),
      techstack: techstackArray,
      job_description: jobDescription,
      candidate_emails: emailsArray,
      show_feedback_to_candidate: showFeedback,
      attempt_limit: Number(attemptLimit),
    };

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication error. Please sign in again.');
        // Consider redirecting: router.push('/signin');
        return;
      }

      const response = await fetch('/api/acharya_ai/hr/interviews/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newInterviewData = await response.json();
        onSuccess(newInterviewData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
            setError('Authentication failed or unauthorized. Please sign in again.');
            // Optionally redirect: router.push('/signin');
        } else if (typeof errorData === 'object' && errorData !== null) {
            let errorMessage = "Failed to create interview: ";
            for (const key in errorData) {
                if (Array.isArray(errorData[key])) {
                    errorMessage += `${key}: ${errorData[key].join(', ')}. `;
                } else {
                    errorMessage += `${key}: ${errorData[key]}. `;
                }
            }
            setError(errorMessage.trim());
        } else {
            setError(errorData.detail || 'Failed to create interview. Please check your input and try again.');
        }
        console.error("Error creating HR interview:", errorData);
      }
    } catch (err) {
      setError('An unexpected network error occurred. Please try again later.');
      console.error('HR Create interview submit error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-1 pr-2" style={{maxHeight: '75vh'}}>
      <div>
        <label htmlFor="hr-role" className="block text-sm font-medium text-gray-700 mb-0.5">Position Name*</label>
        <input type="text" id="hr-role" value={role} onChange={(e) => setRole(e.target.value)} required
               className={`mt-1 block w-full px-3 py-1.5 border ${fieldErrors.role ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
        {fieldErrors.role && <p className="text-red-500 text-xs mt-1">{fieldErrors.role}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hr-level" className="block text-sm font-medium text-gray-700 mb-0.5">Interview Level*</label>
          <select id="hr-level" value={level} onChange={(e) => setLevel(e.target.value)}
                  className={`mt-1 block w-full px-3 py-1.5 border ${fieldErrors.level ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}>
            <option value="Junior">Junior</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>
          {fieldErrors.level && <p className="text-red-500 text-xs mt-1">{fieldErrors.level}</p>}
        </div>
        <div>
          <label htmlFor="hr-type" className="block text-sm font-medium text-gray-700 mb-0.5">Interview Type*</label>
          <select id="hr-type" value={type} onChange={(e) => setType(e.target.value)}
                  className={`mt-1 block w-full px-3 py-1.5 border ${fieldErrors.type ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}>
            <option value="Technical">Technical</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Mixed">Mixed</option>
          </select>
          {fieldErrors.type && <p className="text-red-500 text-xs mt-1">{fieldErrors.type}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="hr-techstack" className="block text-sm font-medium text-gray-700 mb-0.5">Technology Stack (comma-separated)</label>
        <input type="text" id="hr-techstack" value={techstack} onChange={(e) => setTechstack(e.target.value)}
               className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="hr-jobDescription" className="block text-sm font-medium text-gray-700 mb-0.5">Job Description (Optional)</label>
        <textarea id="hr-jobDescription" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={3}
                  className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="hr-candidateEmails" className="block text-sm font-medium text-gray-700 mb-0.5">Candidate Emails (comma-separated, optional)</label>
        <textarea id="hr-candidateEmails" value={candidateEmails} onChange={(e) => setCandidateEmails(e.target.value)} rows={2}
                  className={`mt-1 block w-full px-3 py-1.5 border ${fieldErrors.candidateEmails ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} placeholder="email1@example.com, email2@example.com" />
        {fieldErrors.candidateEmails && <p className="text-red-500 text-xs mt-1">{fieldErrors.candidateEmails}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <label htmlFor="hr-max_questions" className="block text-sm font-medium text-gray-700 mb-0.5">Number of Questions</label>
          <input type="number" id="hr-max_questions" value={maxQuestions} onChange={(e) => setMaxQuestions(Number(e.target.value) < 1 ? 1 : Number(e.target.value))} min="1"
                 className={`mt-1 block w-full px-3 py-1.5 border ${fieldErrors.maxQuestions ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
          {fieldErrors.maxQuestions && <p className="text-red-500 text-xs mt-1">{fieldErrors.maxQuestions}</p>}
        </div>
        <div>
            <label htmlFor="hr-attemptLimit" className="block text-sm font-medium text-gray-700 mb-0.5">Attempt Limit per Candidate</label>
            <input type="number" id="hr-attemptLimit" value={attemptLimit} onChange={(e) => setAttemptLimit(Number(e.target.value) < 1 ? 1 : Number(e.target.value))} min="1"
                   className={`mt-1 block w-full px-3 py-1.5 border ${fieldErrors.attemptLimit ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
            {fieldErrors.attemptLimit && <p className="text-red-500 text-xs mt-1">{fieldErrors.attemptLimit}</p>}
        </div>
      </div>

      <div className="pt-2">
        <label htmlFor="hr-showFeedback" className="flex items-center cursor-pointer">
          <input type="checkbox" id="hr-showFeedback" checked={showFeedback} onChange={(e) => setShowFeedback(e.target.checked)}
                 className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
          <span className="ml-2 text-sm text-gray-700">Show feedback to candidates after completion</span>
        </label>
      </div>

      {error && <p className="text-red-600 text-sm p-2 bg-red-50 rounded-md text-center my-2">{error}</p>}

      <div className="flex justify-end space-x-3 pt-4 border-t mt-5">
        <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">
          Cancel
        </button>
        <button type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          Create & Schedule Interview
        </button>
      </div>
    </form>
  );
}
