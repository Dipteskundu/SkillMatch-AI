"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rocket, Mail, Lock, User, Eye, EyeOff, Github, Chrome, CheckCircle2, ArrowLeft, Briefcase, Building2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { auth, googleProvider, firebaseClientStatus } from "../lib/firebaseClient";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import api from "../lib/apiClient";
import { safeError } from "../lib/logger";
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
function getPostSignUpRedirect() {
    if (typeof window === "undefined") return "/";
    const param = new URLSearchParams(window.location.search).get("redirect");
    if (param && param.startsWith("/") && !param.startsWith("//")) return param;
    return "/";
}

export default function SignUpPage() {
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("candidate"); // candidate or recruiter
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { refreshUser } = useAuth();
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

    // Avoid hydration mismatches caused by browser extensions mutating inputs
    // before React hydrates (e.g., temp mail / password managers).
    if (!mounted) {
        return <div className="min-h-screen bg-white" />;
    }

    async function syncUserWithBackend(user, selectedRole) {
        try {
            await api.post("/api/auth/sync-user", {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                provider: user.providerData?.[0]?.providerId,
                photoURL: user.photoURL,
                role: selectedRole,
            });
            await refreshUser();
        } catch (err) {
            safeError("Failed to sync user with backend", err);
        }
    }

    const handleEmailSignUp = async (event) => {
        event.preventDefault();
        setError("");
        if (firebaseDisabled) {
            setError(
                firebaseReason === "missing-config"
                    ? "Firebase Auth is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars (especially NEXT_PUBLIC_FIREBASE_API_KEY) and restart the dev server."
                    : `Firebase Auth failed to initialize (${firebaseClientStatus.authError || firebaseClientStatus.initError}). Check your NEXT_PUBLIC_FIREBASE_* values (especially NEXT_PUBLIC_FIREBASE_API_KEY).`,
            );
            return;
        }
        setLoading(true);

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: fullName });

            await syncUserWithBackend(
                {
                    ...cred.user,
                    displayName: fullName,
                },
                role
            );

            setAuthSessionCookies(role);
            router.push(getPostSignUpRedirect());
        } catch (err) {
            safeError("Email sign up error", err);
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setError("");
        if (firebaseDisabled) {
            setError(
                firebaseReason === "missing-config"
                    ? "Firebase Auth is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars and restart the dev server."
                    : `Firebase Auth failed to initialize (${firebaseClientStatus.authError || firebaseClientStatus.initError}). Check your NEXT_PUBLIC_FIREBASE_* values.`,
            );
            return;
        }
        setLoading(true);

        try {
            const cred = await signInWithPopup(auth, googleProvider);
            await syncUserWithBackend(cred.user, role);
            setAuthSessionCookies(role);
            router.push(getPostSignUpRedirect());
        } catch (err) {
            safeError("Google sign up error", err);
            setError(normalizeAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfdfe] flex flex-col lg:flex-row-reverse relative">
            {firebaseDisabled && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] max-w-xl w-[calc(100%-2rem)]">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm">
                        {firebaseReason === "missing-config"
                            ? "Firebase Auth is not configured. Add `NEXT_PUBLIC_FIREBASE_API_KEY` (and the other `NEXT_PUBLIC_FIREBASE_*` vars) in `JobMatch-AI/.env.local` (or `JobMatch-AI/.env`) or in Vercel Project Settings → Environment Variables."
                            : `Firebase Auth failed to initialize (${firebaseClientStatus.authError || firebaseClientStatus.initError}). Re-check your Firebase web config values and restart the dev server.`}
                    </div>
                </div>
            )}
            {/* Fixed Back Button */}
            <Link
                href="/"
                className="fixed top-6 left-6 z-[100] flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group"
            >
                <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold text-slate-900">Back</span>
            </Link>

            {/* Side Content (Right side for variety) */}
            <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden flex-col justify-between p-16 animate-slide-in-right">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 group w-fit">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 premium-shadow transition-transform group-hover:rotate-6">
                            <Rocket className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight">
                            SkillMatch<span className="text-indigo-200">AI</span>
                        </span>
                    </Link>
                </div>

                <div className="relative z-10">
                    <h1 className="text-5xl font-black text-white leading-tight mb-8">
                        Launch your <br />
                        <span className="text-indigo-200">next big thing.</span>
                    </h1>

                    <div className="space-y-6">
                        {[
                            "Résumé-based skill extraction",
                            "Structured skill assessments",
                            "Explainable job matches",
                            "Skill-gap analysis for every role"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-4 text-white/90">
                                <CheckCircle2 className="w-6 h-6 text-indigo-300" />
                                <span className="text-lg font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 p-8 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
                    <p className="text-white text-lg font-medium mb-4">
                        Skill-first matching: candidates prove their abilities with assessments, and every match comes with a skill-gap report.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white uppercase tracking-wider">Verified skills</p>
                            <p className="text-xs text-indigo-200 font-bold uppercase">Assessed, not self-reported</p>
                        </div>
                    </div>
                </div>

                {/* Decorative background gradients */}
                <div className="absolute top-0 right-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px]"></div>
                    <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-400 rounded-full blur-[120px]"></div>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative animate-slide-in-left">
                <div className="w-full max-w-md">

                    <div className="mb-10 mt-10">
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Create Account</h2>
                        <p className="text-slate-500 font-medium">Join our community of world-class talent</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleEmailSignUp}>
                        {/* Role Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole("candidate")}
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${role === "candidate"
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                    : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                                    }`}
                            >
                                <Briefcase className="w-5 h-5" />
                                <span className="font-bold">Candidate</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("recruiter")}
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${role === "recruiter"
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                    : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                                    }`}
                            >
                                <Building2 className="w-5 h-5" />
                                <span className="font-bold">Recruiter</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input type="checkbox" className="w-5 h-5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500" />
                            <p className="text-sm text-slate-500 font-medium">
                                I agree to the <Link href="/terms" className="font-bold text-slate-900 underline underline-offset-4">Terms</Link> and <Link href="/privacy" className="font-bold text-slate-900 underline underline-offset-4">Privacy Policy</Link>
                            </p>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 font-medium">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 premium-shadow disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="my-8 flex items-center gap-4">
                        <div className="h-px bg-slate-100 flex-1"></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or sign up with</span>
                        <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                            className="flex items-center justify-center gap-3 py-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Chrome className="w-5 h-5" /> Google
                        </button>
                        <button
                            type="button"
                            disabled
                            className="flex items-center justify-center gap-3 py-4 border border-slate-100 rounded-2xl text-slate-400 cursor-not-allowed"
                        >
                            <Github className="w-5 h-5" /> GitHub
                        </button>
                    </div>

                    <p className="mt-8 text-center text-slate-600 font-medium">
                        Already have an account?{" "}
                        <Link href="/signin" className="text-indigo-600 font-bold hover:underline underline-offset-4">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
