"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Chrome,
  Shield,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { auth, googleProvider, firebaseClientStatus } from "../lib/firebaseClient";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import api from "../lib/apiClient";
import { devLog, devWarn, safeError } from "../lib/logger";
import { useAuth } from "../lib/AuthContext";
import { setAuthSessionCookies } from "../lib/sessionCookie";

function normalizeAuthError(err) {
  const code = String(err?.code || "").toLowerCase();
  const message = String(err?.message || "");

  if (
    code === "auth/unauthorized-domain" ||
    message.includes("Illegal url for new iframe")
  ) {
    return "Google Sign-In is not authorized for this domain yet. Add your Vercel domain under Firebase Authentication \u2192 Settings \u2192 Authorized domains.";
  }

  return message || "Authentication failed";
}

/**
 * Only honor same-origin relative paths (?redirect=/jobs/xyz) to avoid
 * open redirects. Anything else falls back to the landing page.
 */
function getPostSignInRedirect() {
  if (typeof window === "undefined") return "/";
  const param = new URLSearchParams(window.location.search).get("redirect");
  if (param && param.startsWith("/") && !param.startsWith("//")) return param;
  return "/";
}

export default function SignInPage() {
  const { refreshUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastFailedEmail, setLastFailedEmail] = useState("");

  // Forgot Password States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");

  const router = useRouter();
  const firebaseDisabled = !auth;
  const firebaseReason = !firebaseClientStatus.configured
    ? "missing-config"
    : firebaseClientStatus.authError || firebaseClientStatus.initError
      ? "init-failed"
      : "unknown";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (failedAttempts < 3) return;
    if (showResetModal) return;
    setShowResetModal(true);
    setResetEmail(lastFailedEmail || email);
    setResetError("");
    setResetSuccess("");
    setFailedAttempts(0);
  }, [failedAttempts, showResetModal, lastFailedEmail, email]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(message, type = "error") {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }

  function isWrongCredentialError(err) {
    const code = String(err?.code || "").toLowerCase();
    return (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    );
  }

  // Avoid hydration mismatches caused by browser extensions mutating inputs
  // before React hydrates (e.g., temp mail / password managers).
  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  async function syncUserWithBackend(user) {
    let existingRole = "candidate";
    try {
      try {
        const profileRes = await api.get(`/api/auth/profile/${user.uid}`);
        if (profileRes.data.success && profileRes.data.data?.role) {
          existingRole = profileRes.data.data.role;
        }
      } catch (err) {
        devLog("Could not fetch existing profile, using default role");
      }

      await api.post("/api/auth/sync-user", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        provider: user.providerData?.[0]?.providerId,
        photoURL: user.photoURL,
        role: existingRole,
      });

      // Refresh the local profile in AuthContext
      await refreshUser();
    } catch (err) {
      safeError("Failed to sync user with backend", err);
    }
    // Role drives the middleware route-guard cookies set by the caller.
    // Default "candidate" is the most restrictive role (fail-closed).
    return existingRole;
  }

  const handleEmailSignIn = async (event) => {
    event.preventDefault();
    setError("");
    if (firebaseDisabled) {
      showToast(
        firebaseReason === "missing-config"
          ? "Firebase Auth is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars and restart."
          : `Firebase Auth failed to initialize (${firebaseClientStatus.authError || firebaseClientStatus.initError}). Re-check NEXT_PUBLIC_FIREBASE_* values.`,
      );
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const role = await syncUserWithBackend(cred.user);
      setAuthSessionCookies(role);
      sessionStorage.setItem("showWelcome", "1");
      setFailedAttempts(0);
      router.push(getPostSignInRedirect());
    } catch (err) {
      if (isWrongCredentialError(err)) {
        // Expected user-facing error; avoid noisy console errors.
        devWarn("Invalid sign-in credentials");
        setLastFailedEmail(email);
        setFailedAttempts((c) => c + 1);
        showToast("Incorrect email or password. Please try again.");
      } else {
        safeError("Email sign in error", err);
        showToast(err?.message || "Failed to sign in");
      }
      setError(err?.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (firebaseDisabled) {
      setResetError(
        firebaseReason === "missing-config"
          ? "Firebase Auth is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars and restart the dev server."
          : `Firebase Auth failed to initialize (${firebaseClientStatus.authError || firebaseClientStatus.initError}). Check your NEXT_PUBLIC_FIREBASE_* values.`,
      );
      return;
    }
    if (!resetEmail) {
      setResetError("Please enter your email address.");
      return;
    }
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess("Password reset link sent! Please check your inbox.");
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess("");
        setResetEmail("");
      }, 3000);
    } catch (err) {
      safeError("Password reset error", err);
      setResetError(err.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    if (firebaseDisabled) {
      showToast(
        firebaseReason === "missing-config"
          ? "Firebase Auth is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars and restart."
          : `Firebase Auth failed to initialize (${firebaseClientStatus.authError || firebaseClientStatus.initError}). Re-check NEXT_PUBLIC_FIREBASE_* values.`,
      );
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const role = await syncUserWithBackend(cred.user);
      setAuthSessionCookies(role);
      sessionStorage.setItem("showWelcome", "1");
      setFailedAttempts(0);
      router.push(getPostSignInRedirect());
    } catch (err) {
      safeError("Google sign in error", err);
      const msg = normalizeAuthError(err);
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[350] w-[calc(100%-2rem)] max-w-lg">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg border backdrop-blur bg-white/90 ${
              toast.type === "success"
                ? "border-emerald-200 text-emerald-700"
                : "border-red-200 text-red-700"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {firebaseDisabled && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] max-w-xl w-[calc(100%-2rem)]">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm">
            {firebaseReason === "missing-config" ? (
              <>
                Firebase Auth is not configured. Add `NEXT_PUBLIC_FIREBASE_API_KEY` (and the other `NEXT_PUBLIC_FIREBASE_*` vars) in `JobMatch-AI/.env.local` (or `JobMatch-AI/.env`) or in Vercel Project Settings → Environment Variables.
              </>
            ) : (
              <>
                Firebase Auth failed to initialize ({firebaseClientStatus.authError || firebaseClientStatus.initError}). Re-check your Firebase web config values in `JobMatch-AI/.env.local` (or `JobMatch-AI/.env`) and restart the dev server.
              </>
            )}
          </div>
        </div>
      )}
      {/* ── Left Panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col justify-start p-12 xl:p-16 relative overflow-hidden gap-10" style={{ backgroundColor: "#6452F5" }}>
        {/* Back button — desktop only, inside left panel */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors w-fit z-10 relative"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 w-fit z-10 relative">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            SkillMatch<span className="text-blue-200">AI</span>
          </span>
        </Link>

        {/* Headline */}
        <div className="z-10 relative">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-5">
            The future of work<br />is skill-verified.
          </h1>
          <p className="text-blue-100 text-base xl:text-lg leading-relaxed max-w-sm">
            Connect with top employers using AI-powered skill matching and verified credentials.
          </p>

          {/* Stat cards */}
          <div className="mt-10 flex flex-col gap-4">
            {/* Card 1 */}
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-5 max-w-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Skill Verification</span>
              </div>
              <p className="text-white text-sm font-semibold leading-snug">
                Candidates prove their skills with structured assessments before applying
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-5 max-w-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Explainable Matching</span>
              </div>
              <p className="text-white text-sm font-semibold leading-snug">
                Every match comes with a skill-gap report so you know exactly why
              </p>
            </div>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3" style={{ backgroundColor: "rgba(100,82,245,0.5)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" style={{ backgroundColor: "rgba(79,60,220,0.4)" }} />
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-6 pt-6 pb-10 sm:px-10 lg:px-12 xl:px-16 min-h-screen lg:min-h-0">
        {/* Mobile back button — left, logo — right */}
        <div className="w-full flex items-center justify-between lg:hidden mb-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#6452F5" }}>
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900">
              SkillMatch<span style={{ color: "#6452F5" }}>AI</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8 mt-14">
            <h2 className="text-3xl font-black text-slate-900 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in to your SkillMatch AI account</p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex items-center justify-center gap-2.5 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Chrome className="w-4 h-4" />
              Google
            </button>
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2.5 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed"
            >
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">or</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetEmail(email);
                  }}
                  className="text-xs font-semibold hover:opacity-80 transition-opacity" style={{ color: "#6452F5" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-slate-600">Remember me</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "#6452F5" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign Into SkillMatch"
              )}
            </button>
          </form>

          {/* Signup link */}
          <p className="mt-5 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold hover:underline underline-offset-4" style={{ color: "#6452F5" }}>
              Create one for free
            </Link>
          </p>

          {/* Footer links */}
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/privacy" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <span className="text-slate-200 text-xs">|</span>
            <Link href="/terms" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Terms of Service</Link>
            <span className="text-slate-200 text-xs">|</span>
            <Link href="/contact" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Contact Support</Link>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowResetModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Reset Password</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {resetError && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {resetSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-full py-3 text-slate-500 font-semibold text-sm hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
