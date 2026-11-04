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
import Skeleton from "../../components/common/Skeleton";
import { useScrollReveal } from "../../lib/useScrollReveal";
import { RecruiterPipelineChart, RecruiterJobsChart } from "./DashboardCharts";
import api, { API_BASE } from "../../lib/apiClient";
import { safeError } from "../../lib/logger";

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


      const res = await api.post("/api/jobs", jobData);
      const result = res.data;

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
        {/* Recent Applicants */}
        <div className="lg:col-span-2 space-y-4">
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
          {/* Hiring Score */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h3 className="font-bold text-sm">AI Hiring Score Formula</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Skill Match", pct: 50, color: "bg-indigo-500" },
                { label: "Test Score", pct: 30, color: "bg-blue-500" },
                { label: "Experience", pct: 20, color: "bg-cyan-500" },
              ].map(({ label, pct, color }) => (
                <div key={label}>
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
                      className={`h-full ${color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-4">
              Candidates are ranked by our AI model using this formula.
            </p>
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
                        {job.applicantsCount ?? 0}{" "}
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
