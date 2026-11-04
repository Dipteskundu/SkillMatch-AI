"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "./apiClient";

const AuthContext = createContext(null);
const TOKEN_KEY = "jwt_token";
const REFRESH_KEY = "refresh_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await api.get("/api/auth/me");
    const profile = res.data?.success ? res.data.data : null;
    setUser(profile);
    if (!profile) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
    return profile;
  }, []);

  // Restore the session from the stored token on first load.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email, password) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });
      if (!res.data?.success || !res.data.token) {
        return { success: false, message: res.data?.message || "Login failed" };
      }
      localStorage.setItem(TOKEN_KEY, res.data.token);
      if (res.data.refreshToken) localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Cannot reach the server. Please try again.",
      };
    }
  };

  const register = async (email, password, role = "candidate", displayName = "") => {
    try {
      const res = await api.post("/api/auth/register", { email, password, role, displayName });
      if (!res.data?.success || !res.data.token) {
        return { success: false, message: res.data?.message || "Registration failed" };
      }
      localStorage.setItem(TOKEN_KEY, res.data.token);
      if (res.data.refreshToken) localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Cannot reach the server. Please try again.",
      };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      // Best effort: revoke server-side, but never block sign-out.
      api.post("/api/auth/logout", { refreshToken }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
  };

  const value = {
    user,
    userProfile: user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    loading,
    // Kept for pages that wait on auth before fetching.
    firebaseReady: true,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
