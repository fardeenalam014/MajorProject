/**
 * AuthContext.jsx
 * Place at: src/context/AuthContext.jsx
 *
 * Tokens stored as "token_student" / "token_creator" so two roles
 * can be tested simultaneously in the same browser without clobbering
 * each other's sessions.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(null);

/* ── helpers ── */
const tokenKey  = (role) => role ? `token_${role}` : "token";

const readToken = () =>
  // try role-scoped keys first, fall back to legacy "token" key
  localStorage.getItem("token_student") ??
  localStorage.getItem("token_creator") ??
  localStorage.getItem("token") ??
  null;

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => readToken());
  const [loading, setLoading] = useState(true);

  /* On mount — re-hydrate user from whichever token exists */
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    authAPI.me().then(({ data, error }) => {
      if (data?.user) setUser(data.user);
      else            clearAuth();
      setLoading(false);
    });
  }, []); // run once

  const saveAuth = ({ token: t, user: u }) => {
    const key = tokenKey(u?.role);       // e.g. "token_student" or "token_creator"
    localStorage.setItem(key, t);
    // remove the other role's token so only one session is "active"
    // (comment these two lines out if you WANT both active simultaneously)
    localStorage.removeItem(key === "token_student" ? "token_creator" : "token_student");
    localStorage.removeItem("token");    // remove legacy key
    setToken(t);
    setUser(u);
  };

  const clearAuth = () => {
    localStorage.removeItem("token_student");
    localStorage.removeItem("token_creator");
    localStorage.removeItem("token");           // legacy
    localStorage.removeItem("activeTestId");
    localStorage.removeItem("activeStudentUser");
    localStorage.removeItem("currentTest");
    setToken(null);
    setUser(null);
  };

  const login  = (payload) => saveAuth(payload);
  const logout = () => clearAuth();

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};