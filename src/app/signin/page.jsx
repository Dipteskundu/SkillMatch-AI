"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Shield,
  Briefcase,
  X,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { devWarn, safeError } from "../lib/logger";
import { postLoginPath } from "../lib/redirect";
import { useAuth } from "../lib/AuthContext";
import AuthShell from "../components/common/AuthShell";

// 16px inputs prevent the iOS focus-zoom jump; focus style matches Learning Hub.
const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 focus:bg-white";

export default function SignInPage() {
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Forgot Password States
  const [showResetModal, setShowResetModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (failedAttempts < 3) return;
    if (showResetModal) return;
    setShowResetModal(true);
    setFailedAttempts(0);
  }, [failedAttempts, showResetModal]);

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

  // Avoid hydration mismatches caused by browser extensions mutating inputs
  // before React hydrates (e.g., temp mail / password managers).
  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  const handleEmailSignIn = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        devWarn("Invalid sign-in credentials");
        setFailedAttempts((c) => c + 1);
        setError(result.message);
        showToast(result.message);
        return;
      }
      sessionStorage.setItem("showWelcome", "1");
      setFailedAttempts(0);
      router.push(postLoginPath());
    } catch (err) {
      safeError("Email sign in error", err);
      setError("Failed to sign in");
      showToast("Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[350] w-[calc(100%-2rem)] max-w-lg">
          <div
            className={`animate-fade-in rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg border backdrop-blur bg-white/90 ${
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
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthShell
        heading="Welcome back!"
        subheading="Enter your registered email address and password to sign in."
        panelTitle={
          <>
            The future of work is{" "}
            <span className="text-indigo-600">skill-verified.</span>
          </>
        }
        panelCaption={
          <>
            One account for <b className="text-slate-700">candidates, recruiters and admins</b>{" "}
            — your progress follows you across the whole platform.
          </>
        }
      >
        <form
          onSubmit={handleEmailSignIn}
          className="animate-card-rise flex flex-col gap-5"
          style={{ animationDelay: "120ms" }}
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pl-11 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="animate-fade-in text-sm text-red-500 font-medium"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-sm font-semibold text-indigo-600 hover:underline underline-offset-4"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="animate-fade-up text-center text-sm text-slate-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-indigo-600 hover:underline underline-offset-4"
          >
            Create one for free
          </Link>
        </p>

        {/* Quick Access */}
        <div
          className="animate-card-rise mt-7"
          style={{ animationDelay: "200ms" }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
            Demo accounts — one tap to fill
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                role: "Admin",
                email: "admin@manager.com",
                password: "admin@manager.com",
                icon: Shield,
              },
              {
                role: "Recruiter",
                email: "diptesemon@gmail.com",
                password: "diptesemon@gmail.com",
                icon: Briefcase,
              },
              {
                role: "Candidate",
                email: "dipteskundu6@gmail.com",
                password: "dipteskundu6@gmail.com",
                icon: User,
              },
            ].map(({ role: r, email: e, password: p, icon: Icon }) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setEmail(e);
                  setPassword(p);
                }}
                className="flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="text-[10px] font-bold">{r}</span>
              </button>
            ))}
          </div>
        </div>
      </AuthShell>

      {/* ── Forgot Password Modal ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="animate-fade-in absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setShowResetModal(false)}
          />
          <div className="animate-scale-in relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-indigo-600" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">
                Reset password
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Password reset links aren&apos;t available yet. Email{" "}
                <a
                  href="mailto:support@jobmatch.ai"
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  support@jobmatch.ai
                </a>{" "}
                and we&apos;ll help you regain access.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
