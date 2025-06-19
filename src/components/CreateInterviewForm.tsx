'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // For potential redirection on auth error

export default function CreateInterviewForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (newInterview: any) => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('Junior');
  const [type, setType] = useState('Technical');
  const [techstack, setTechstack] = useState('');
  const [jobDescription, setJobDescription] = useState(''); // Added as per subtask
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!role.trim()) newErrors.role = 'Position Name is required.';
    if (!level) newErrors.level = 'Interview Level is required.';
    if (!type) newErrors.type = 'Interview Type is required.';
    // Tech stack is optional, job description is optional

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

    const techstackArray = techstack.split(',').map(item => item.trim()).filter(item => item);

    // The backend's CreateInterviewSerializer expects: role, type, level, techstack, max_questions
    // max_questions is not in this form, so backend will use its default or it should be added.
    // For now, let's assume backend CreateInterviewSerializer has a default for max_questions or it's optional.
    // The backend view `InterviewCreateView` uses `data['max_questions']` which implies it's expected.
    // Let's add a default max_questions to the payload for now.
    const payload = {
      role,
      level,
      type,
      techstack: techstackArray,
      job_description: jobDescription, // Sending this; backend might ignore if not in serializer
      max_questions: 5, // Defaulting, as it's used in the backend view.
      // `questions` and `finalized` are handled by the backend.
    };

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication error. Please sign in again.');
        // Consider redirecting to signin page after a delay
        // router.push('/signin');
        return;
      }

      const response = await fetch('/api/acharya_ai/interviews/create/', { // Corrected API endpoint
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
            setError('Authentication failed. Please sign in again.');
            // Optionally redirect: router.push('/signin');
        } else if (typeof errorData === 'object' && errorData !== null) {
            let errorMessage = "Failed to create interview. Check inputs. ";
            for (const key in errorData) {
                if (Array.isArray(errorData[key])) {
                    errorMessage += `${key}: ${errorData[key].join(', ')}. `;
                } else {
                    errorMessage += `${key}: ${errorData[key]}. `;
                }
            }
            setError(errorMessage.trim());
        }
        else {
            setError(errorData.detail || 'Failed to create interview. Please check your input.');
        }
        console.error("Error creating interview:", errorData);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
      console.error('Create interview submit error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Position Name*</label>
        <input type="text" id="role" value={role} onChange={(e) => setRole(e.target.value)} required
               className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.role ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} />
        {fieldErrors.role && <p className="text-red-500 text-xs mt-1">{fieldErrors.role}</p>}
      </div>
      <div>
        <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">Interview Level*</label>
        <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.level ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}>
          <option value="Junior">Junior</option>
          <option value="Mid-Level">Mid-Level</option>
          <option value="Senior">Senior</option>
        </select>
        {fieldErrors.level && <p className="text-red-500 text-xs mt-1">{fieldErrors.level}</p>}
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Interview Type*</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.type ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}>
          <option value="Technical">Technical</option>
          <option value="Behavioral">Behavioral</option>
          <option value="Mixed">Mixed</option>
        </select>
        {fieldErrors.type && <p className="text-red-500 text-xs mt-1">{fieldErrors.type}</p>}
      </div>
      <div>
        <label htmlFor="techstack" className="block text-sm font-medium text-gray-700 mb-1">Technology Stack (comma-separated)</label>
        <input type="text" id="techstack" value={techstack} onChange={(e) => setTechstack(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">Job Description (Optional)</label>
        <textarea id="jobDescription" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      {error && <p className="text-red-600 text-sm p-2 bg-red-50 rounded-md text-center">{error}</p>}
      <div className="flex justify-end space-x-3 pt-3 border-t mt-6">
        <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
          Cancel
        </button>
        <button type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          Create Interview
        </button>
      </div>
    </form>
  );
}
