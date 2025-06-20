
// API Configuration
export const API_ENDPOINTS = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
    WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://0.0.0.0:8000/ws',
  } as const;
  
  // Application Routes
  export const ROUTES = {
    HOME: '/',
    LOGIN: '/auth/signin',
    REGISTER: '/auth/signup',
    DASHBOARD: '/dashboard',
    HR_DASHBOARD: '/hr/dashboard',
    INTERVIEW: (id: string) => `/interview/${id}`,
    PROFILE: '/profile',
  } as const;
  
  // User Types
  export const USER_TYPES = {
    CANDIDATE: 'candidate',
    HR: 'hr',
  } as const;
  
  // Interview Types
  export const INTERVIEW_TYPES = {
    TECHNICAL: 'technical',
    BEHAVIORAL: 'behavioral',
    MIXED: 'mixed',
  } as const;
  
  // Interview Levels
  export const INTERVIEW_LEVELS = {
    ENTRY: 'entry',
    MID: 'mid',
    SENIOR: 'senior',
    LEAD: 'lead',
  } as const;
  
  // Status Types
  export const INVITATION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
  } as const;
  
  // Tech Stack Options
  export const TECH_STACKS = [
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'Vue.js',
    'Angular',
    'Node.js',
    'Python',
    'Django',
    'Flask',
    'Java',
    'Spring Boot',
    'C#',
    '.NET',
    'PHP',
    'Ruby',
    'Rails',
    'Go',
    'Rust',
    'C++',
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'AWS',
    'Azure',
    'GCP',
    'Docker',
    'Kubernetes',
    'DevOps',
  ] as const;
  
  // Validation Constants
  export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    MAX_INTERVIEW_QUESTIONS: 20,
    MIN_INTERVIEW_QUESTIONS: 1,
    MAX_ATTEMPTS: 5,
    MIN_ATTEMPTS: 1,
    MAX_TIME_LIMIT: 180, // minutes
    MIN_TIME_LIMIT: 15, // minutes
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  } as const;
  
  // UI Constants
  export const UI = {
    SIDEBAR_WIDTH: 280,
    HEADER_HEIGHT: 64,
    MOBILE_BREAKPOINT: 768,
    TOAST_DURATION: 5000,
    DEBOUNCE_DELAY: 300,
  } as const;
  
  // Error Messages
  export const ERROR_MESSAGES = {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access denied.',
    NOT_FOUND: 'Resource not found.',
    VALIDATION: 'Please check your input and try again.',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
    INVALID_FILE_TYPE: 'Invalid file type.',
  } as const;
  
  // Success Messages
  export const SUCCESS_MESSAGES = {
    LOGIN: 'Successfully logged in!',
    REGISTER: 'Account created successfully!',
    LOGOUT: 'Successfully logged out!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    INTERVIEW_CREATED: 'Interview created successfully!',
    INTERVIEW_UPDATED: 'Interview updated successfully!',
    INTERVIEW_DELETED: 'Interview deleted successfully!',
    FEEDBACK_SUBMITTED: 'Feedback submitted successfully!',
  } as const;
  
  // Loading Messages
  export const LOADING_MESSAGES = {
    SIGNING_IN: 'Signing you in...',
    CREATING_ACCOUNT: 'Creating your account...',
    LOADING_DASHBOARD: 'Loading dashboard...',
    CREATING_INTERVIEW: 'Creating interview...',
    UPDATING_PROFILE: 'Updating profile...',
    GENERATING_FEEDBACK: 'Generating feedback...',
  } as const;
  