import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, removeToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('protec_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await api.getProfile();
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('protec_user_profile', JSON.stringify(res.user));
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Auth check failed:', err.message);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res.success) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getProfile();
      if (res.success) {
        setUser(res.user);
        localStorage.setItem('protec_user_profile', JSON.stringify(res.user));
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
