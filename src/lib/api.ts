import axios from 'axios';
import { API_ENDPOINTS } from './constants';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  user_type: string;
  company?: string;
  position?: string;
}) => {
  const response = await api.post('/users/register/', userData);
  return response.data;
};

export const loginUser = async (credentials: {
  username: string;
  password: string;
}) => {
  const response = await api.post('/users/login/', credentials);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/users/profile/');
  return response.data;
};

export const updateUserProfile = async (userData: any) => {
  const response = await api.patch('/users/profile/', userData);
  return response.data;
};

export const changePassword = async (passwordData: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  const response = await api.post('/users/change-password/', passwordData);
  return response.data;
};

export const resetPassword = async (email: string) => {
  const response = await api.post('/users/reset-password/', { email });
  return response.data;
};

export const confirmPasswordReset = async (resetData: {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}) => {
  const response = await api.post('/users/reset-password/confirm/', resetData);
  return response.data;
};

export const refreshToken = async (refreshToken: string) => {
  const response = await api.post('/users/login/refresh/', { refresh: refreshToken });
  return response.data;
};

// Interview API functions
export const createInterview = async (interviewData: {
  title?: string;
  role: string;
  type: string;
  level: string;
  techstack: string[];
  job_description?: string;
  max_questions: number;
  max_attempts?: number;
  time_limit?: number;
  show_feedback?: boolean;
  candidate_emails?: string[];
}) => {
  const response = await api.post('/acharya_ai/interviews/create/', interviewData);
  return response.data;
};

export const getInterviews = async () => {
  const response = await api.get('/acharya_ai/interviews/');
  return response.data;
};

export const getInterviewDetail = async (interviewId: string) => {
  const response = await api.get(`/acharya_ai/interviews/${interviewId}/`);
  return response.data;
};

export const getInterviewFeedback = async (interviewId: string) => {
  const response = await api.get(`/acharya_ai/interviews/${interviewId}/feedback/`);
  return response.data;
};

// Updated feedback creation to send transcript to Gemini for analysis
export const createFeedback = async (feedbackData: {
  interview_id: string;
  transcript: Array<{role: string, content: string}>;
}) => {
  const response = await api.post('/acharya_ai/feedback/create/', feedbackData);
  return response.data;
};

// HR API functions
export const getHRAnalytics = async () => {
  const response = await api.get('/acharya_ai/hr/analytics/');
  return response.data;
};

export const getHRInterviews = async () => {
  const response = await api.get('/acharya_ai/hr/interviews/');
  return response.data;
};

export const getInterviewInvitations = async (interviewId: string) => {
  const response = await api.get(`/acharya_ai/interviews/${interviewId}/invitations/`);
  return response.data;
};

export const acceptInvitation = async (invitationId: string) => {
  const response = await api.post(`/acharya_ai/invitations/${invitationId}/accept/`);
  return response.data;
};

export const getInvitationByToken = async (token: string) => {
  const response = await api.get(`/acharya_ai/invitations/${token}/`);
  return response.data;
};

export default api;