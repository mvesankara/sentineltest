"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // For redirection

// Define types
interface User {
  id: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  // Add any other user properties you need
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, passwordInput: string) => Promise<void>;
  register: (email: string, passwordInput: string, companyName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // For checking initial auth status
  const router = useRouter();

  useEffect(() => {
    // Check for token in localStorage on initial load
    const storedToken = localStorage.getItem('sentinelle_token');
    const storedUserString = localStorage.getItem('sentinelle_user');
    if (storedToken && storedUserString) {
      try {
        const storedUser = JSON.parse(storedUserString);
        setToken(storedToken);
        setUser(storedUser);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem('sentinelle_token');
        localStorage.removeItem('sentinelle_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, passwordInput: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', { // Assuming your backend runs on the same domain or proxied
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('sentinelle_token', data.token);
      localStorage.setItem('sentinelle_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw to be caught by the form
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, passwordInput: string, companyName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordInput, companyName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      // Typically, after registration, you'd redirect to login or auto-login
      alert('Registration successful! Please login.'); // Simple feedback
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Re-throw
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sentinelle_token');
    localStorage.removeItem('sentinelle_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, loading }}>
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
