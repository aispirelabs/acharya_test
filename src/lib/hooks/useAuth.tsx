
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '../api';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'candidate' | 'hr';
  company?: string;
  position?: string;
  phone?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  user_type: 'candidate' | 'hr';
  company?: string;
  position?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/profile/');
      if (response.data && !response.error) {
        setUser(response.data);
      } else {
        // Token might be invalid, clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await api.post('/users/login/', {
        username: email, // Backend expects username field but we're sending email
        password,
      });

      if (response.data && !response.error) {
        const { access, refresh, user: userData } = response.data;
        
        // Store tokens
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        
        // Set user data
        setUser(userData);
        
        // Redirect based on user type
        if (userData.user_type === 'hr') {
          router.push('/hr/dashboard');
        } else {
          router.push('/dashboard');
        }
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await api.post('/users/register/', userData);

      if (response.data && !response.error) {
        // Auto login after successful registration
        const loginResult = await login(userData.email, userData.password);
        return loginResult;
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/auth/signin');
  };

  const updateProfile = async (profileData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.put('/users/profile/', profileData);

      if (response.data && !response.error) {
        setUser(response.data);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Profile update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      });

      if (response.data && !response.error) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Password change failed' };
      }
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/users/reset-password/', { email });

      if (response.data && !response.error) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Password reset failed' };
      }
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
