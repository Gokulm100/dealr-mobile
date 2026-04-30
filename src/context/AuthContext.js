// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, getStoredToken, saveAuth, clearAuth, API_BASE_URL } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedUser = await getStoredUser();
      const storedToken = await getStoredToken();
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
        // Check if user has consented
        setHasConsented(storedUser.hasConsented || false);
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
      // Check for consent status using multiple possible field names
      // Specifically checking 'hasConsented' as mentioned in requirements
      const userHasConsented = !!(data.user.hasConsented || data.user.isConsented || data.user.consentAccepted);

      // Normalizing the user object to always have hasConsented property
      const normalizedUser = { ...data.user, hasConsented: userHasConsented };

      await saveAuth(data.token, normalizedUser);
      setToken(data.token);
      setUser(normalizedUser);
      setHasConsented(userHasConsented);
      return data;
    }
    throw new Error('Login failed');
  };

  const logout = async () => {
    await clearAuth();
    setUser(null);
    setToken(null);
    setHasConsented(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, hasConsented, setHasConsented, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
