// User types
export interface User {
    id: string;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    user_type: 'candidate' | 'hr';
    phone?: string;
    photoURL?: string;
    created_at: string;
  }
  
  export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
  }
  
  // Interview types
  export interface Interview {
    id: string;
    user: string;
    title?: string;
    role: string;
    type: 'technical' | 'behavioral' | 'mixed';
    level: 'entry' | 'mid' | 'senior' | 'lead';
    techstack: string[];
    questions: string[];
    job_description?: string;
    finalized: boolean;
    cover_image?: string;
    max_attempts: number;
    time_limit: number;
    show_feedback: boolean;
    candidate_emails: string[];
    resume_url?: string;
    created_at: string;
    updated_at: string;
    feedbacks?: Feedback[];
  }
  
  export interface CreateInterviewRequest {
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
    resume_url?: File;
  }
  
  // Interview Invitation types
  export interface InterviewInvitation {
    id: string;
    interview: string;
    interview_title?: string;
    interview_role?: string;
    candidate_email: string;
    candidate?: string;
    status: 'pending' | 'accepted' | 'completed' | 'expired';
    attempts_used: number;
    invitation_token: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
  }
  
  // Feedback types
  export interface CategoryScore {
    name: string;
    score: number;
    comment: string;
  }
  
  export interface Feedback {
    id: string;
    interview: string;
    interview_id: string;
    user: string;
    invitation?: string;
    total_score: number;
    category_scores: CategoryScore[];
    strengths: string[];
    areas_for_improvement: string[];
    final_assessment: string;
    attempt_number: number;
    created_at: string;
  }
  
  export interface CreateFeedbackRequest {
    interview_id: string;
    transcript: TranscriptItem[];
  }
  
  export interface TranscriptItem {
    role: string;
    content: string;
  }
  
  // HR Analytics types
  export interface HRAnalytics {
    total_interviews: number;
    total_candidates: number;
    completed_interviews: number;
    average_score: number;
    completion_rate: number;
    active_interviews: number;
    monthly_growth: number;
    recent_interviews: Interview[];
    popular_roles: Array<{
      role: string;
      count: number;
    }>;
  }
  
  // API Response types
  export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    status?: number;
  }
  
  export interface PaginatedResponse<T> {
    count: number;
    next?: string;
    previous?: string;
    results: T[];
  }
  
  // Form types
  export interface LoginForm {
    username: string;
    password: string;
  }
  
  export interface RegisterForm {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    first_name?: string;
    last_name?: string;
    user_type: 'candidate' | 'hr';
    phone?: string;
  }
  
  export interface ProfileUpdateForm {
    first_name?: string;
    last_name?: string;
    phone?: string;
    photoURL?: string;
  }
  
  // UI State types
  export interface LoadingState {
    [key: string]: boolean;
  }
  
  export interface ErrorState {
    [key: string]: string | null;
  }
  