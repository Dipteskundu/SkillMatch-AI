"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import api, { API_BASE } from "../../lib/apiClient";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Briefcase,
  Loader2,
  ChevronLeft,
} from "lucide-react";

export default function SkillGapAnalysisPage({ params }) {
  const jobId = params?.jobId;

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const apiBase = API_BASE;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [matchScore, setMatchScore] = useState(0);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");

  const [applying, setApplying] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (!jobId || !user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Job title/company (best-effort)
      const jobRes = await api.get(`/api/jobs/${jobId}`);
      if (jobRes.status === 200) {
        const jobData = jobRes.data;
        setJobTitle(jobData.data?.title || "Job");
        setCompany(jobData.data?.company || "");
      }

      const res = await api.get(`/api/skill-gap/${jobId}/${user.uid}`);
      const data = res.data;

      if (data.success) {
        setMatchScore(data.data.matchScore || 0);
        setMatchedSkills(data.data.matchedSkills || []);
        setMissingSkills(data.data.missingSkills || []);
        setSuggestions(data.data.suggestions || []);
      } else {
        setError(data.message || "Failed to load skill gap analysis.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while analyzing your skill gap.");
    } finally {
      setLoading(false);
    }
  }, [jobId, user?.uid]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (!jobId) {
      setError("Missing job id.");
      setLoading(false);
      return;
    }
    fetchAnalysis();
  }, [authLoading, fetchAnalysis, isAuthenticated, jobId, router]);

  const handleApplyAnyway = async () => {
    try {
      if (!user?.uid) return;
      setApplying(true);
      const res = await api.post(`/api/jobs/${jobId}/apply`, {
        uid: user.uid,
        email: user.email,
        jobTitle: jobTitle,
        company: company,
        location: "", // we don't have location here but it's optional
      });
      const data = res.data;
      if (res.ok && data.success) {
        router.push("/applications");
      } else {
        alert(data.message || "Application failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-page flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-900">
            Analyzing Your Resume...
          </h2>
          <p className="text-slate-500 mt-2 max-w-sm text-center">
            Our AI is comparing your profile against the job requirements to
            generate a personalized skill gap report.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen theme-page flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center pt-20 pb-24 px-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Analysis Error
          </h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Go Back
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-page flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-bold text-sm mb-4">
            <Lightbulb className="w-4 h-4" /> Skill Gap Analysis
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">
            {jobTitle}
          </h1>
          {company && (
            <p className="text-lg text-slate-500 mt-2 font-medium">
              at {company}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Match Score & Skills Overview) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Match Score Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 premium-shadow flex flex-col items-center">
              <h3 className="font-extrabold text-slate-900 mb-6 w-full text-center">
                Your Match Score
              </h3>

              <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 120 120"
                >
                  {/* Background Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  {/* Foreground Progress */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={
                      matchScore >= 80
                        ? "#10b981"
                        : matchScore >= 50
                          ? "#f59e0b"
                          : "#ef4444"
                    }
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(matchScore / 100) * (2 * Math.PI * 50)} 314`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900">
                    {matchScore}%
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-500 text-center">
                {matchScore >= 80
                  ? "Strong match! You meet most requirements."
                  : matchScore >= 50
                    ? "Moderate match. Consider upskilling."
                    : "Low match. Significant upskilling recommended."}
              </p>
            </div>

            {/* Skills Overview */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 premium-shadow">
              {/* Skills You Have */}
              <div className="mb-8">
                <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wide mb-4">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  Skills You Have
                </h4>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold rounded-xl"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No matching skills found.
                  </p>
                )}
              </div>

              {/* Skills to Improve */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wide mb-4">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  Missing Skills
                </h4>
                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold rounded-xl"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    You have all the required skills!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (AI Suggestions & Action Buttons) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  AI Learning Path
                </h2>
                <p className="text-slate-500 mt-1 max-w-lg leading-relaxed">
                  Our AI analyzed your missing skills and created a personalized
                  roadmap to help you qualify for this position.
                </p>
              </div>
            </div>

            {/* Suggestions Cards */}
            <div className="space-y-4">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow flex gap-4"
                  >
                    <div className="w-12 h-12 shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 leading-snug">
                        {suggestion}
                      </h4>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-3 font-medium">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        Recommended Action
                      </p>
                    </div>
                  </div>
                ))
              ) : missingSkills.length > 0 ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                  <p className="text-slate-500">
                    Generating suggestions failed or no suggestions available.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 p-8 rounded-2xl border border-emerald-100 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    You are perfectly qualified!
                  </h3>
                  <p className="text-slate-600">
                    You already possess all the core skills for this role. You
                    are ready to apply.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/search?q=Learn+${missingSkills.join("+")}`,
                    "_blank",
                  )
                }
                className="w-full sm:w-auto flex-1 px-6 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-center hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Start Learning
              </button>

              <button
                onClick={handleApplyAnyway}
                disabled={applying}
                className="w-full sm:w-auto flex-1 px-6 py-4 bg-indigo-600 border-2 border-indigo-600 text-white rounded-2xl font-black text-center hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {applying ? "Submitting..." : "Apply Anyway"}{" "}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
