"use client";

import { useAuth } from "./AuthContext";
import { signInUrlWithReturn } from "./redirect";

/**
 * Gate a personalized action behind sign-in (LH-003 / LH-004).
 *
 * Returns a function that sends guests to /signin?redirect=<currentPath>
 * and returns false so the caller can abort. Authenticated users get true
 * and continue normally.
 *
 *   const requireLogin = useRequireLogin();
 *   const handleEnroll = () => { if (!requireLogin()) return; ... };
 */
export function useRequireLogin() {
  const { user, loading } = useAuth();

  return function requireLogin() {
    if (user) return true;
    if (loading) return false; // still resolving — don't bounce mid-boot

    const { pathname, search } = window.location;
    const returnTo = `${pathname}${search || ""}`;
    window.location.assign(signInUrlWithReturn(returnTo));
    return false;
  };
}
