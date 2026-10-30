"use client";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { API_BASE, apiFetch } from "../../lib/apiClient";

export default function ResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const sessionId = searchParams.get("sessionId");

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push("/signin");
            return;
        }
        if (!sessionId) {
            setTimeout(() => {
                setError("Missing session ID.");
                setLoading(false);
            }, 0);
            return;
        }

        const apiBase = API_BASE;
        apiFetch(`/api/communication/result/${sessionId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setResult(data.data);
                } else {
                    setError(data.message || "Failed to load result");
                }
            })
            .catch((err) => {
                setError(err.message || "Failed to load result");
            })
            .finally(() => setLoading(false));
    }, [authLoading, isAuthenticated, sessionId, router]);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#fdfdfe] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdfdfe] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading result...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-[#fdfdfe]">
                <Navbar />
                <main className="pt-32 pb-24">
                    <div className="container mx-auto px-6 lg:px-24 max-w-xl text-center">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12">
                            <p className="text-red-600 font-medium mb-6">{error || "Result not found"}</p>
                            <Link
                                href="/jobs"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                            >
                                Back to Jobs <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const score = result.score ?? 0;
    const scoreColor =
        score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";

    return (
        <div className="min-h-screen bg-[#fdfdfe]">
            <Navbar />

            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6 lg:px-24 max-w-2xl">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 premium-shadow overflow-hidden">
                        <div className="p-10 sm:p-14 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                                Communication Score
                            </h1>
                            <p className={`text-5xl sm:text-6xl font-black ${scoreColor} mb-2`}>
                                {score}/100
                            </p>
                            <p className="text-slate-500 font-medium mb-8">
                                Your responses have been evaluated and saved.
                            </p>

                            {result.feedback && (
                                <div className="text-left p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                                        <span className="font-bold text-slate-900">AI Feedback</span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {result.feedback}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                                {result.clarityScore != null && (
                                    <div className="p-4 bg-slate-50 rounded-xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clarity</p>
                                        <p className="text-xl font-black text-slate-900">{result.clarityScore}</p>
                                    </div>
                                )}
                                {result.toneScore != null && (
                                    <div className="p-4 bg-slate-50 rounded-xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tone</p>
                                        <p className="text-xl font-black text-slate-900">{result.toneScore}</p>
                                    </div>
                                )}
                                {result.grammarScore != null && (
                                    <div className="p-4 bg-slate-50 rounded-xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grammar</p>
                                        <p className="text-xl font-black text-slate-900">{result.grammarScore}</p>
                                    </div>
                                )}
                                {result.structureScore != null && (
                                    <div className="p-4 bg-slate-50 rounded-xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Structure</p>
                                        <p className="text-xl font-black text-slate-900">{result.structureScore}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/jobs"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                                >
                                    Browse More Jobs <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="/profile"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    View Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
