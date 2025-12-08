import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, usersAPI } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  profile_picture_url?: string;
  bio?: string;
  user_number?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage and validate token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Validate token by making a lightweight API call
          // Use the user's own profile endpoint to verify token is valid
          const userData = JSON.parse(storedUser);
          
          // Set user immediately from localStorage (optimistic)
          setToken(storedToken);
          setUser(userData);
          
          // Validate token in background
          try {
            await usersAPI.getProfile(userData.id);
            console.log('✅ Token validated, user restored from localStorage');
          } catch (validationError: any) {
            // Only clear if it's a 401 (unauthorized) - other errors might be network issues
            if (validationError.response?.status === 401) {
              console.log('❌ Token validation failed (401), clearing auth state');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            } else {
              // Network error or other issue - keep the user logged in
              console.warn('⚠️ Token validation failed (non-401), keeping user logged in:', validationError.message);
            }
          }
        } catch (parseError) {
          // Failed to parse user data
          console.error('❌ Failed to parse stored user data, clearing auth state');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for token expiration events from API interceptor
    const handleTokenExpired = () => {
      console.log('🔔 Token expired event received');
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);

    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: newUser } = response.data;

      if (!newToken || !newUser) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Handle 429 rate limit specifically
      if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again in 15 minutes.');
      }
      
      // Handle 403 account lock specifically
      if (error.response?.status === 403) {
        throw new Error(error.response?.data?.message || 'Account temporarily locked');
      }
      
      // Handle 401 with attempt countdown
      if (error.response?.status === 401) {
        throw new Error(error.response?.data?.message || 'Invalid email or password');
      }
      
      // Generic fallback
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Invalid email or password';
      throw new Error(errorMessage);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await authAPI.register({ username, email, password });
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

