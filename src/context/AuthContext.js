// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, getStoredToken, saveAuth, clearAuth, API_BASE_URL } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedUser = await getStoredUser();
      const storedToken = await getStoredToken();
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
      }
      setLoading(false);
    })();
  }, []);

  const loginWithGoogle = async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken }),
    });
    const data = await response.json();
    if (data.token && data.user) {
      await saveAuth(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return data;
    }
    throw new Error('Login failed');
  };

  const logout = async () => {
    await clearAuth();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
