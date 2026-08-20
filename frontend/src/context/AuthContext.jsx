import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

// Decode JWT payload (no verify — server always verifies)
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('auth_role') || null);

  useEffect(() => {
    // Attach token to every outgoing request
    const interceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [token]);

  const login = (jwt) => {
    const decoded = decodeToken(jwt);
    const userRole = decoded?.role || 'admin';
    setToken(jwt);
    setRole(userRole);
    localStorage.setItem('auth_token', jwt);
    localStorage.setItem('auth_role', userRole);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
  };

  return (
    <AuthContext.Provider
      value={{ token, role, login, logout, isAuthenticated: !!token, isAdmin: role === 'admin', isVolunteer: role === 'volunteer' }}
    >
      {children}
    </AuthContext.Provider>
  );
};
