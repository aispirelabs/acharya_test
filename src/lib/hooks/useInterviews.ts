
'use client';

import { useState, useEffect, useCallback } from 'react';
import { interviewAPI } from '../api';
import type { Interview, CreateInterviewRequest, Feedback } from '../types';

interface UseInterviewsReturn {
  interviews: Interview[];
  isLoading: boolean;
  error: string | null;
  createInterview: (data: CreateInterviewRequest) => Promise<Interview | null>;
  getInterview: (id: string) => Promise<Interview | null>;
  updateInterview: (id: string, data: Partial<Interview>) => Promise<Interview | null>;
  deleteInterview: (id: string) => Promise<boolean>;
  getInterviewFeedback: (id: string) => Promise<Feedback[] | null>;
  refreshInterviews: () => Promise<void>;
  clearError: () => void;
}

export const useInterviews = (): UseInterviewsReturn => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshInterviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await interviewAPI.getAll();
      if (response.data) {
        setInterviews(response.data.results || response.data);
      } else {
        setError(response.error || 'Failed to fetch interviews');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInterview = useCallback(async (data: CreateInterviewRequest): Promise<Interview | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await interviewAPI.create(data);
      if (response.data) {
        setInterviews(prev => [response.data, ...prev]);
        return response.data;
      } else {
        setError(response.error || 'Failed to create interview');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInterview = useCallback(async (id: string): Promise<Interview | null> => {
    setError(null);

    try {
      const response = await interviewAPI.getById(id);
      if (response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch interview');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      return null;
    }
  }, []);

  const updateInterview = useCallback(async (id: string, data: Partial<Interview>): Promise<Interview | null> => {
    setError(null);

    try {
      const response = await interviewAPI.update(id, data);
      if (response.data) {
        setInterviews(prev => 
          prev.map(interview => 
            interview.id === id ? response.data : interview
          )
        );
        return response.data;
      } else {
        setError(response.error || 'Failed to update interview');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      return null;
    }
  }, []);

  const deleteInterview = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await interviewAPI.delete(id);
      if (response.status === 204 || !response.error) {
        setInterviews(prev => prev.filter(interview => interview.id !== id));
        return true;
      } else {
        setError(response.error || 'Failed to delete interview');
        return false;
      }
    } catch (err) {
      setError('Network error occurred');
      return false;
    }
  }, []);

  const getInterviewFeedback = useCallback(async (id: string): Promise<Feedback[] | null> => {
    setError(null);

    try {
      const response = await interviewAPI.getFeedback(id);
      if (response.data) {
        return response.data.results || response.data;
      } else {
        setError(response.error || 'Failed to fetch feedback');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      return null;
    }
  }, []);

  // Initialize interviews
  useEffect(() => {
    refreshInterviews();
  }, [refreshInterviews]);

  return {
    interviews,
    isLoading,
    error,
    createInterview,
    getInterview,
    updateInterview,
    deleteInterview,
    getInterviewFeedback,
    refreshInterviews,
    clearError,
  };
};
