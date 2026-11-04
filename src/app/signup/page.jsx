"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  Briefcase,
  Building2,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { safeError } from "../lib/logger";
import { useAuth } from "../lib/AuthContext";
import { postLoginPath } from "../lib/redirect";
import AuthShell from "../components/common/AuthShell";

// 16px inputs prevent the iOS focus-zoom jump; focus style matches Learning Hub.
const inputClass =
  "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 focus:bg-white";

const ROLES = [
  { value: "candidate", label: "Candidate", icon: Briefcase },
  { value: "recruiter", label: "Recruiter", icon: Building2 },
];

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("candidate"); // candidate or recruiter
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatches caused by browser extensions mutating inputs
  // before React hydrates (e.g., temp mail / password managers).
  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  const handleEmailSignUp = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await register(email, password, role, fullName);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.push(postLoginPath());
    } catch (err) {
      safeError("Email sign up error", err);
      setError("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AuthShell
        heading="Create your account!"
        subheading="Join the platform where skills get verified before they get hired."
        panelTitle={
          <>
            Launch your <span className="text-indigo-600">next big thing.</span>
          </>
        }
        panelCaption={
          <>
            From <b className="text-slate-700">first match to first offer</b> —
            AI matching, skill verification, and interviews in one place.
          </>
        }
      >
        <form
          onSubmit={handleEmailSignUp}
          className="animate-card-rise flex flex-col gap-5"
          style={{ animationDelay: "120ms" }}
        >
          {/* Role selection */}
          <div>
            <p className="block text-sm font-semibold text-slate-700 mb-1.5">
              I&apos;m joining as
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ value, label, icon: Icon }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    aria-pressed={active}
                    className={`flex items-center gap-2.5 h-12 px-4 rounded-2xl border-2 font-bold text-sm transition-all active:scale-[0.98] ${
                      active
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    <Icon
                      className="w-[18px] h-[18px]"
                      aria-hidden="true"
                    />
                    {label}
                    {active && (
                      <Check
                        className="animate-badge-pop w-4 h-4 ml-auto"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Full name
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

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
                autoComplete="new-password"
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

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              required
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 leading-relaxed">
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-bold text-slate-900 underline underline-offset-4"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-bold text-slate-900 underline underline-offset-4"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="animate-fade-in text-sm text-red-500 font-medium"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="animate-fade-up text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-indigo-600 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </AuthShell>
    </div>
  );
}
