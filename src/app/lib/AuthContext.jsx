"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseClient";

import api from "./apiClient";
import {
  setAuthSessionCookies,
  clearAuthSessionCookies,
} from "./sessionCookie";
import { useAppDispatch } from "../store/hooks";
import { syncAuth } from "../store/authSlice";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const firebaseReady = Boolean(auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const res = await api.get(`/api/auth/profile/${firebaseUser.uid}`);
          if (res.data.success) {
            setUserProfile(res.data.data);
            // Keep the middleware route-guard marker in sync with the
            // backend role (refreshes the short-lived cookie on load).
            setAuthSessionCookies(res.data.data?.role);
          }
        } catch (err) {
          console.error("Failed to fetch user profile in AuthContext:", err);
        }
      } else {
        setUserProfile(null);
        clearAuthSessionCookies();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mirror auth state into the Redux store so non-context consumers can read
  // it via selectors. Firebase (this context) remains the source of truth.
  useEffect(() => {
    dispatch(syncAuth({ user, userProfile, loading }));
  }, [dispatch, user, userProfile, loading]);

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    clearAuthSessionCookies();
  };

  const refreshUser = async () => {
    if (!auth) return;
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
      try {
        const res = await api.get(`/api/auth/profile/${auth.currentUser.uid}`);
        if (res.data.success) {
          setUserProfile(res.data.data);
          setAuthSessionCookies(res.data.data?.role);
        }
      } catch (err) {
        console.error("Failed to refresh user profile:", err);
      }
    }
  };

  const value = {
    user,
    userProfile,
    role: userProfile?.role || null,
    loading,
    isAuthenticated: !!user,
    firebaseReady,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

