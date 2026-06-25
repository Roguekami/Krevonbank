import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      return data;
    } catch (error) {
      setUser(null);
      localStorage.removeItem('krevon_token');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Login: store token + user directly (no follow-up /auth/me needed)
  const loginUser = (token, userData) => {
    if (token) {
      localStorage.setItem('krevon_token', token);
    }
    setUser(userData);
  };

  // Logout: clear token from localStorage
  const logoutUser = () => {
    localStorage.removeItem('krevon_token');
    setUser(null);
  };

  useEffect(() => {
    // On mount, check if we have a stored token and verify it
    const storedToken = localStorage.getItem('krevon_token');
    if (storedToken) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, fetchUser, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
