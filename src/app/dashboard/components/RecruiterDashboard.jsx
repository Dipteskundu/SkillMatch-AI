"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Users,
  TrendingUp,
  Target,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  Star,
  BarChart2,
  Mail,
  X,
} from "lucide-react";
import Link from "next/link";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../../lib/firebaseClient";
import Skeleton from "../../components/common/Skeleton";
import { useScrollReveal } from "../../lib/useScrollReveal";
import { RecruiterPipelineChart, RecruiterJobsChart } from "./DashboardCharts";
import api, { API_BASE } from "../../lib/apiClient";
import { devLog, safeError } from "../../lib/logger";
import {
  FACTOR_LABELS,
  DEFAULT_WEIGHTS,
  applicationScore,
  scoreBand,
  topContributors,
} from "../../lib/scoreDisplay";

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div
        className={`${bg} ${color} p-3 rounded-xl shrink-0 group-hover:scale-105 transition-transform`}
      >
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function RecruiterDashboard({ user, data, loading }) {
  const [liveApplicantCounts, setLiveApplicantCounts] = useState({});
  const [showPostJob, setShowPostJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    salaryRange: "",
    experienceLevel: "",
    employmentType: "",
    skills: "",
    description: "",
    responsibilities: "",
    vacancies: "",
    deadline: "",
  });
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState(null);
  const revealRef = useScrollReveal();

  // Debug: Check if user data is available
  devLog("RecruiterDashboard mounted with user:", user);
  devLog("User UID available:", !!user?.uid);

  useEffect(() => {
    if (!data?.jobs || !rtdb) return;
    const unsubscribes = data.jobs.map((job) => {
      const countRef = ref(rtdb, `jobApplicants/${job._id}`);
      return onValue(countRef, (snapshot) => {
        const val = snapshot.val();
        if (val?.count !== undefined) {
          setLiveApplicantCounts((prev) => ({ ...prev, [job._id]: val.count }));
        }
      });
    });
    return () => unsubscribes.forEach((u) => u());
  }, [data?.jobs]);

  if (loading) {
    return (
      <div
        className="space-y-6"
        aria-busy="true"
        aria-label="Loading recruiter dashboard"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <Skeleton className="w-12 h-12 rounded-xl mb-4" />
              <Skeleton className="h-7 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Active Jobs",
      value: data?.stats?.activeJobs ?? "0",
      icon: Briefcase,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Total Applicants",
      value: data?.stats?.totalApplicants ?? "0",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Shortlisted",
      value: data?.stats?.shortlisted ?? "0",
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Interviews Set",
      value: data?.stats?.interviews ?? "0",
      icon: Target,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const handlePostJob = async (e) => {
    e.preventDefault();
    setPosting(true);

    // Debug logging
    devLog("User data:", user);
    devLog("User UID:", user?.uid);

    // Check if user UID exists
    if (!user?.uid) {
      safeError("No user UID available!", null);
      setPostMsg({
        type: "error",
        text: "User not authenticated. Please refresh and try again.",
      });
      setPosting(false);
      return;
    }

    try {
      const jobData = {
        ...jobForm,
        skills: jobForm.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        responsibilities: jobForm.responsibilities
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean),
        vacancies: jobForm.vacancies ? parseInt(jobForm.vacancies, 10) : null,
        postedBy: user?.uid,
      };

      devLog("Sending job data:", jobData);

      const res = await api.post("/api/jobs", jobData);
      const result = res.data;
      devLog("Job creation result:", result);

      if (result.success) {
        setPostMsg({ type: "success", text: "Job posted successfully." });
        setJobForm({
          title: "",
          company: "",
          location: "",
          salaryRange: "",
          experienceLevel: "",
          employmentType: "",
          skills: "",
          description: "",
          responsibilities: "",
          vacancies: "",
          deadline: "",
        });
        setShowPostJob(false);

        // Refresh dashboard data to update stats
        window.location.reload();
      } else {
        setPostMsg({
          type: "error",
          text: result.message || "Failed to post job.",
        });
      }
    } catch (error) {
      safeError("Job posting error", error);
      setPostMsg({ type: "error", text: "Network error. Please try again." });
    }
    setPosting(false);
    setTimeout(() => setPostMsg(null), 4000);
  };

  const handleContact = (email) => {
    window.location.href = `mailto:${email}`;
  };

  /* ── Explainable ranking data ──────────────────────────────────────
   * topCandidates is pre-sorted by aiScore.total (desc) on the backend.
   * Weights come from the first application that actually carries them,
   * so the card always reflects the real scoring formula; otherwise we
   * show the documented fit-v1 defaults. */
  const topCandidates = Array.isArray(data?.topCandidates) ? data.topCandidates : [];
  const weightSourceApps = [
    ...topCandidates,
    ...(Array.isArray(data?.recentApplications) ? data.recentApplications : []),
  ];
  const liveWeightsApp = weightSourceApps.find(
    (a) => a?.aiScore?.weights && typeof a.aiScore.weights === "object",
  );
  const rankingWeightMap = liveWeightsApp?.aiScore?.weights || DEFAULT_WEIGHTS;
  const weightRows = Object.entries(FACTOR_LABELS)
    .map(([factor, label]) => ({
      factor,
      label,
      pct: rankingWeightMap[factor] ?? DEFAULT_WEIGHTS[factor] ?? 0,
    }))
    .filter((row) => row.pct > 0)
    .sort((a, b) => b.pct - a.pct);
  const weightColors = ["bg-indigo-500", "bg-blue-500", "bg-cyan-500", "bg-violet-500", "bg-emerald-500"];

  const handleStatusChange = async (appId, newStatus) => {
    let feedback = null;
    if (newStatus === "rejected") {
      feedback = prompt("Provide feedback for this rejection (optional):");
      if (feedback === null) return;
    }
    try {
      await api.put(`/api/applications/${appId}/status`, { status: newStatus, feedback });
    } catch (err) {
      safeError("Status update failed", err);
    }
  };

  return (
    <div className="space-y-8" ref={revealRef}>
      {/* Toast */}
      {postMsg && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg font-semibold text-sm text-white transition-all ${postMsg.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {postMsg.text}
          <button
            onClick={() => setPostMsg(null)}
            aria-label="Dismiss"
            className="ml-1 opacity-80 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <section aria-label="Recruiter stats" className="reveal">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Charts */}
      <section aria-label="Pipeline charts" className="reveal delay-75">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RecruiterPipelineChart stats={data?.stats} />
          <RecruiterJobsChart jobs={data?.jobs} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column: Top Candidates + Recent Applicants */}
        <div className="lg:col-span-2 space-y-8">
          {/* Top Candidates — explainable AI scores */}
          {topCandidates.length > 0 && (
            <section aria-labelledby="top-candidates-heading">
              <h2
                id="top-candidates-heading"
                className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4"
              >
                <Star className="w-5 h-5 text-amber-500" aria-hidden="true" />
                Top Candidates
                <span className="text-xs font-semibold text-slate-400 ml-1">
                  ranked by match score
                </span>
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <ul role="list" className="divide-y divide-slate-100">
                  {topCandidates.map((app, i) => {
                    const score = applicationScore(app);
                    const band = scoreBand(score);
                    const contributors = topContributors(app?.aiScore, 2);
                    const comm =
                      typeof app?.communicationScore === "number"
                        ? app.communicationScore
                        : null;
                    const name =
                      app?.displayName || app?.email?.split("@")[0] || "Candidate";
                    return (
                      <li key={app?._id || i}>
                        <Link
                          href="/applicants"
                          className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
                          title={`See ${name}'s full score breakdown`}
                        >
                          <span
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-500 text-xs shrink-0"
                            aria-hidden="true"
                          >
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {app?.jobTitle || "Application"}
                              {app?.company ? ` — ${app.company}` : ""}
                            </p>
                            {contributors.length > 0 && (
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                Top factors:{" "}
                                {contributors
                                  .map((c) => `${c.label} ${c.score}`)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                          {score !== null ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border shrink-0 ${band.className}`}
                              title={`Match score ${score} out of 100`}
                            >
                              {score}
                            </span>
                          ) : comm !== null ? (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 text-slate-500 bg-slate-50 border-slate-200"
                              title="This candidate has not been match-scored yet."
                            >
                              Communication: {comm}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 text-slate-400 bg-slate-50 border-slate-200"
                            >
                              Not scored yet
                            </span>
                          )}
                          <ChevronRight
                            className="w-4 h-4 text-slate-300 shrink-0"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          {/* Recent Applicants */}
          <section aria-labelledby="applicants-heading">
            <h2
              id="applicants-heading"
              className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4"
            >
              <Users className="w-5 h-5 text-indigo-500" aria-hidden="true" />
              Recent Applicants
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {(data?.recentApplications || []).length > 0 ? (
                <ul role="list" className="divide-y divide-slate-100">
                  {data.recentApplications.map((app, i) => (
                    <li
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-indigo-500 text-sm shrink-0"
                          aria-hidden="true"
                        >
                          {app.email?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {app.email}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {app.jobTitle} — {app.company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <label
                          htmlFor={`status-${app._id || i}`}
                          className="sr-only"
                        >
                          Update status for {app.email}
                        </label>
                        <select
                          id={`status-${app._id || i}`}
                          defaultValue={app.status || "submitted"}
                          onChange={(e) =>
                            handleStatusChange(app._id, e.target.value)
                          }
                          className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                        >
                          <option value="submitted">Submitted</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="rejected">Rejected</option>
                          <option value="selected">Selected</option>
                        </select>
                        <button
                          onClick={() => handleContact(app.email)}
                          className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                          Contact
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-12 text-center">
                  <Users
                    className="w-10 h-10 text-slate-300 mx-auto mb-3"
                    aria-hidden="true"
                  />
                  <p className="text-slate-500 font-medium text-sm">
                    No applicants yet
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Post a job to start receiving applications.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5" aria-label="Recruiter tools">
          {/* How candidates are ranked — honest, from real API weights */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h3 className="font-bold text-sm">How candidates are ranked</h3>
            </div>
            <p className="text-slate-500 text-[11px] mb-4">
              {liveWeightsApp
                ? "Live weights from your current scoring model (fit-v1)."
                : "Standard scoring weights (fit-v1). Live weights appear once candidates are scored."}
            </p>
            <div className="space-y-3">
              {weightRows.map(({ factor, label, pct }, i) => (
                <div key={factor}>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-white font-bold">{pct}%</span>
                  </div>
                  <div
                    className="h-1.5 bg-slate-700 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label}: ${pct}%`}
                  >
                    <div
                      className={`h-full ${weightColors[i % weightColors.length]} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-4">
              Every score is explainable — click a candidate to see their
              breakdown.
            </p>
            <Link
              href="/about"
              className="inline-block text-indigo-400 text-xs font-semibold mt-2 hover:text-indigo-300 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
            >
              Learn how scoring works →
            </Link>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <BarChart2
                className="w-4 h-4 text-indigo-500"
                aria-hidden="true"
              />
              Active Jobs
            </h3>
            {(data?.jobs || []).length > 0 ? (
              <ul role="list" className="space-y-2">
                {data.jobs.map((job, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                        {job.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {liveApplicantCounts[job._id] ??
                          job.applicantsCount ??
                          0}{" "}
                        applicants
                      </p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0 ml-2"
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No active jobs yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
