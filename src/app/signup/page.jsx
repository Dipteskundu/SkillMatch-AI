"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rocket, Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowLeft, Briefcase, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { safeError } from "../lib/logger";
import { useAuth } from "../lib/AuthContext";
import { postLoginPath } from "../lib/redirect";

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
        <div className="min-h-screen bg-[#fdfdfe] flex flex-col lg:flex-row-reverse relative">
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
                            JobMatch<span className="text-indigo-200">AI</span>
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
                            "Personalized AI job matching",
                            "Direct connection with top recruiters",
                            "Real-time salary market insights",
                            "Expert career growth resources"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-4 text-white/90">
                                <CheckCircle2 className="w-6 h-6 text-indigo-300" />
                                <span className="text-lg font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 p-8 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
                    <p className="text-white text-lg font-medium italic mb-4">
                        &quot;JobMatch AI helped me land my Senior Product Designer role in less than 2 weeks. The AI suggestions were spot on!&quot;
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                        <div>
                            <p className="text-sm font-bold text-white uppercase tracking-wider">Sarah Jenkins</p>
                            <p className="text-xs text-indigo-200 font-bold uppercase">Senior Designer @ Meta</p>
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
                                I agree to the <Link href="#" className="font-bold text-slate-900 underline underline-offset-4">Terms</Link> and <Link href="#" className="font-bold text-slate-900 underline underline-offset-4">Privacy Policy</Link>
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
