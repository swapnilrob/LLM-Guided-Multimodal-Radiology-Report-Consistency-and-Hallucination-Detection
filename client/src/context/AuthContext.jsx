import { createContext, useContext, useState, useCallback } from 'react';

// 1. Create the context — think of this as a "shared box" every component can reach into
const AuthContext = createContext(null);

// 2. The Provider component wraps the entire app and holds the auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // stores the logged-in user object (or null)
  const [token, setToken] = useState(null);      // stores the JWT access token (or null)

  // Called after successful login or register
  const login = useCallback((userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
  }, []);

  // Called when the user logs out
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  // isAuthenticated is true when we have both a user and a token
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Custom hook — any component can call useAuth() to get the user, token, login, logout
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
} 