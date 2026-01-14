import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: Student | null;
  student: Student | null; // Alias for user
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount and fetch fresh profile from API
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        // Immediately set the stored user (even without isAdmin flag)
        // This prevents the UI from flickering
        setUser(parsedUser);

        // Fetch fresh profile data from API to get latest isAdmin status
        const fetchProfile = async () => {
          try {
            const response = await apiService.getStudentProfile(parsedUser.email);
            console.log('AuthContext mount: API response:', response);
            console.log('AuthContext mount: isAdmin flag:', response.data?.isAdmin);

            if (response.success && response.data) {
              const userData: Student = {
                studentId: response.data.email.split('@')[0],
                email: response.data.email,
                name: response.data.fullName,
                batch: response.data.batch,
                isAdmin: response.data.isAdmin || false,
              };
              console.log('AuthContext mount: Updated user data:', userData);

              // Only update if isAdmin status actually changed
              // This triggers a re-render in components watching student.isAdmin
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (error) {
            console.error('Error fetching fresh profile:', error);
          } finally {
            setLoading(false);
          }
        };

        fetchProfile();
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    try {
      // Call backend API to get student profile with isAdmin flag
      const response = await apiService.getStudentProfile(email);

      console.log('AuthContext: API response:', response);
      console.log('AuthContext: isAdmin flag:', response.data?.isAdmin);

      if (response.success && response.data) {
        const userData: Student = {
          studentId: response.data.email.split('@')[0],
          email: response.data.email,
          name: response.data.fullName,
          batch: response.data.batch,
          isAdmin: response.data.isAdmin || false,
        };
        console.log('AuthContext: Created user data:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Fallback to basic user object if API fails
        const userData: Student = {
          studentId: email.split('@')[0],
          email,
          name: email.split('@')[0],
          batch: 'Unknown',
          isAdmin: false,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    student: user, // Alias for user
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
