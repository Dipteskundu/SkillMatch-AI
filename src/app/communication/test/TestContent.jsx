"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, MessageSquare, Send } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../lib/AuthContext";
import api, { API_BASE } from "../../lib/apiClient";

export default function TestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [sessionId, setSessionId] = useState(searchParams.get("sessionId") || "");
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState("");

  const jobId = searchParams.get("jobId") || "";
  const jobTitle = searchParams.get("jobTitle") || "";
  const company = searchParams.get("company") || "";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (sessionId || !jobId) return;

    const startSession = async () => {
      setStarting(true);
      setError("");
      try {
        const res = await api.post("/api/communication/start", { jobId, jobTitle, company });
        const json = res.data;
        const newSessionId = json?.data?.sessionId || json?.sessionId || "";
        if (res.status !== 200 || !newSessionId) {
          throw new Error(json?.message || "Failed to start communication session");
        }
        setSessionId(newSessionId);
        router.replace(`/communication/test?sessionId=${encodeURIComponent(newSessionId)}`);
      } catch (err) {
        setError(err?.message || "Failed to start communication session");
      } finally {
        setStarting(false);
      }
    };

    startSession();
  }, [authLoading, isAuthenticated, sessionId, jobId, jobTitle, company, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId) {
      setError("Missing session ID. Please restart the test.");
      return;
    }
    if (response.trim().length < 10) {
      setError("Please provide a more complete response before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await api.post(`/api/communication/submit/${sessionId}`, { response });
      const json = res.data;
      if (res.status !== 200) {
        throw new Error(json?.message || "Failed to submit response");
      }
      router.push(`/communication/result?sessionId=${encodeURIComponent(sessionId)}`);
    } catch (err) {
      setError(err?.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || starting) {
    return (
      <div className="min-h-screen theme-page flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen theme-page">
        <Navbar />
        <main className="pt-32 pb-24">
          <div className="container mx-auto px-6 lg:px-24 max-w-xl text-center">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12">
              <p className="text-red-600 font-medium mb-6">
                {error || "Missing session ID. Please start the test again."}
              </p>
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

  return (
    <div className="min-h-screen theme-page">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 lg:px-24 max-w-2xl">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 premium-shadow p-10 sm:p-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Communication Test
              </h1>
            </div>

            <p className="text-slate-600 font-medium mb-6 leading-relaxed">
              Answer the prompt below in your own words. Your response will be evaluated
              for clarity, tone, grammar, and structure.
            </p>

            {error && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Prompt
                </p>
                <p className="text-slate-700 font-medium">
                  Describe a time you handled a difficult conversation with a stakeholder
                  and how you ensured a positive outcome.
                </p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Your Response
                </label>
                <textarea
                  rows={7}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your response here..."
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Response"}
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
