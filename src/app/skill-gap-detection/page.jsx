"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import {
  Lightbulb,
  Search,
  Briefcase,
  MapPin,
  Building,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Sparkles,
  Target,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import PageWrapper from "../components/common/PageWrapper";
import { API_BASE, apiFetch } from "../lib/apiClient";

export default function SkillGapDetectionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const apiBase = API_BASE;

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [analyzingId, setAnalyzingId] = useState(null);

  // Auth guard
  useEffect(() => {
    if (isAuthenticated === false && user === null) {
      router.push("/signin");
    }
  }, [isAuthenticated, user, router]);

  // Fetch all jobs
  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchJobs() {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/jobs`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || data.jobs || [];
        setJobs(list);
        setFilteredJobs(list);
      } catch (err) {
        console.error(err);
        setError("Could not load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [isAuthenticated, apiBase]);

  // Live search filter
  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setFilteredJobs(jobs);
      return;
    }
    setFilteredJobs(
      jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q) ||
          (Array.isArray(j.skills) && j.skills.some((s) => s.toLowerCase().includes(q)))
      )
    );
  }, [query, jobs]);

  const handleAnalyze = useCallback(
    (jobId) => {
      setAnalyzingId(jobId);
      router.push(`/skill-gap-analysis/${jobId}`);
    },
    [router]
  );

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfe] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-semibold">Loading available jobs…</p>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="min-h-screen bg-[#fdfdfe] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-24 gap-4 px-4">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <p className="text-slate-700 font-bold text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfe] flex flex-col font-sans">
      <Navbar />

      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white py-16 px-4 animate-fade-up">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" /> AI-Powered
          </span>

          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
            Skill Gap Detection
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Pick any job below and our AI will compare it against your profile, showing your match
            score, missing skills, and a personalised learning roadmap.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Target, text: "Instant match score" },
              { icon: TrendingUp, text: "Missing skill radar" },
              { icon: BookOpen, text: "AI learning path" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <Icon className="w-4 h-4 text-indigo-200" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search Bar ── */}
      <section className="max-w-4xl mx-auto w-full px-4 -mt-6 z-10 relative animate-fade-up delay-150">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 px-5 py-4">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by job title, company, location, or skill…"
            className="flex-1 bg-transparent text-[15px] text-slate-700 placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* ── Jobs Grid ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <PageWrapper>
        {/* Count row */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-slate-500">
            {filteredJobs.length === 0
              ? "No jobs match your search"
              : `${filteredJobs.length} job${filteredJobs.length !== 1 ? "s" : ""} found`}
          </p>
          {query && (
            <p className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full">
              Searching: &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <Briefcase className="w-16 h-16 text-slate-200" />
            <p className="text-slate-500 font-semibold text-lg">No matching jobs found</p>
            <p className="text-slate-400 text-sm">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredJobs.map((job) => {
              const jobId = job._id || job.id;
              const isAnalyzing = analyzingId === jobId;
              const skills = Array.isArray(job.skills) ? job.skills.slice(0, 4) : [];
              const extraSkillsCount = (job.skills?.length || 0) - skills.length;

              return (
                <div
                  key={jobId}
                  className="group bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-100 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-extrabold text-slate-900 text-[15px] leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {job.title || "Untitled Role"}
                      </h2>
                      {job.company && (
                        <p className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-0.5">
                          <Building className="w-3 h-3" />
                          {job.company}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {job.location && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium -mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {job.location}
                    </p>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg"
                        >
                          {s}
                        </span>
                      ))}
                      {extraSkillsCount > 0 && (
                        <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold rounded-lg">
                          +{extraSkillsCount} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => handleAnalyze(jobId)}
                    disabled={isAnalyzing}
                    className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white text-sm font-extrabold rounded-xl transition-all active:scale-95"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4" />
                        Analyze Skill Gap
                        <ArrowRight className="w-4 h-4 ml-auto opacity-60" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
