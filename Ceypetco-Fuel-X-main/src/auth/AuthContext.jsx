import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);          // { id, role, name, email, ... }
  const [token, setToken] = useState(null);        // jwt
  const isAuthenticated = !!token;

  // Restore from localStorage on refresh
  useEffect(() => {
    const t = localStorage.getItem('fuelx_token');
    const u = localStorage.getItem('fuelx_user');
    if (t && u) {
      setToken(t);
      try { setUser(JSON.parse(u)); } catch { setUser(null); }
    }
  }, []);

  const login = (jwt, userObj) => {
    setToken(jwt);
    setUser(userObj);
    localStorage.setItem('fuelx_token', jwt);
    localStorage.setItem('fuelx_user', JSON.stringify(userObj));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fuelx_token');
    localStorage.removeItem('fuelx_user');
  };

  const value = useMemo(() => ({ user, token, isAuthenticated, login, logout }), [user, token, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
