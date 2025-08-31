import React, { createContext, useContext, useEffect, useState } from 'react';

// Mock user data
const mockUsers = [
  { email: 'demo@example.com', password: 'demo123', name: 'Demo User' },
  { email: 'test@example.com', password: 'test123', name: 'Test User' }
];

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Simulate Google sign-in
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        email: 'google.user@example.com',
        name: 'Google User',
        photoURL: 'https://via.placeholder.com/40',
        provider: 'google'
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return mockUser;
    } catch (error) {
      setError('Google sign-in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      const userData = {
        email: user.email,
        name: user.name,
        provider: 'email'
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === email);
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      const userData = {
        email,
        name: email.split('@')[0], // Use email prefix as name
        provider: 'email'
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Simulate logout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 