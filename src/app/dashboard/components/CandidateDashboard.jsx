"use client";

import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import {
  Briefcase,
  Bookmark,
  TrendingUp,
  Clock,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  Zap,
  BadgeCheck,
  Target,
} from "lucide-react";
import Link from "next/link";
import Skeleton from "../../components/common/Skeleton";
import ApplicationPulseTracker from "./candidate/ApplicationPulseTracker";
import GrowthFeedbackCard from "../../components/GrowthFeedback/GrowthFeedbackCard";
import UpcomingInterviews from "./UpcomingInterviews";
import { useScrollReveal } from "../../lib/useScrollReveal";
import { CandidateStatusChart, ProfileCompletionChart } from "./DashboardCharts";
import PlanCard from "./PlanCard";

const STATUS_STYLES = {
  applied: "bg-blue-100 text-blue-700",
  submitted: "bg-blue-100 text-blue-700",
  ai_scored: "bg-indigo-100 text-indigo-700",
  viewed: "bg-sky-100 text-sky-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-amber-100 text-amber-700",
  hired: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

function StatCard({ label, value, icon: Icon, color, bg, href }) {
  const card = (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group h-full ${
        href ? "cursor-pointer" : ""
      }`}
    >
      <div
        className={`${bg} ${color} p-3 rounded-xl shrink-0 group-hover:scale-105 transition-transform`}
      >
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground font-medium mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
  if (href)
    return (
      <Link href={href} aria-label={`${label}: ${value}`}>
        {card}
      </Link>
    );
  return <div aria-label={`${label}: ${value}`}>{card}</div>;
}

export default function CandidateDashboard({ data, loading }) {
  const { user } = useAuth();
  const [expandedApps, setExpandedApps] = useState({});
  const revealRef = useScrollReveal();

  if (loading) {
    return (
      <div
        className="space-y-6"
        aria-busy="true"
        aria-label="Loading candidate dashboard"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const profileCompletion = data?.profileCompletion || 0;
  const recentApplications = data?.applications || [];
  const rejectedWithFeedback = recentApplications.filter(
    (app) =>
      app.status === "rejected" && app.feedback?.missingSkills?.length > 0,
  );

  const stats = [
    {
      label: "Applied Jobs",
      value: data?.stats?.applied || "0",
      icon: Briefcase,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/applications",
    },
    {
      label: "Saved Jobs",
      value: data?.stats?.saved || "0",
      icon: Bookmark,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/saved-jobs",
    },
    {
      label: "Interviews",
      value: data?.stats?.interviews || "0",
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/interviews",
    },
    {
      label: "Pending Tasks",
      value: data?.stats?.pendingTasks || "0",
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/my-tasks",
    },
    {
      label: "Profile Strength",
      value: `${profileCompletion}%`,
      icon: TrendingUp,
      color: profileCompletion >= 80 ? "text-emerald-600" : "text-orange-600",
      bg: profileCompletion >= 80 ? "bg-emerald-50" : "bg-orange-50",
      href: "/profile/edit",
    },
  ];

  return (
    <div
      className="space-y-8 text-foreground"
      ref={revealRef}
      style={{ color: "var(--foreground)" }}
    >
      {profileCompletion < 80 && (
        <div
          role="alert"
          className="reveal flex items-start gap-4 p-5 bg-orange-50 border border-orange-200 rounded-2xl"
        >
          <AlertCircle
            className="w-5 h-5 text-orange-500 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">
              Your profile is {profileCompletion}% complete
            </p>
            <p className="text-muted-foreground text-sm mt-0.5">
              Complete your profile to increase visibility with recruiters.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {!data?.profile?.bio && (
                <span className="text-xs font-medium px-2.5 py-1 bg-white border border-orange-200 rounded-lg text-orange-700">
                  Add Bio
                </span>
              )}
              {!data?.profile?.skills?.length && (
                <span className="text-xs font-medium px-2.5 py-1 bg-white border border-orange-200 rounded-lg text-orange-700">
                  Add Skills
                </span>
              )}
              {!data?.profile?.experience?.length && (
                <span className="text-xs font-medium px-2.5 py-1 bg-white border border-orange-200 rounded-lg text-orange-700">
                  Add Experience
                </span>
              )}
              {!data?.profile?.education?.length && (
                <span className="text-xs font-medium px-2.5 py-1 bg-white border border-orange-200 rounded-lg text-orange-700">
                  Add Education
                </span>
              )}
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="shrink-0 text-sm font-semibold text-orange-700 hover:text-orange-800 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-orange-400 rounded"
          >
            Edit Profile
          </Link>
        </div>
      )}

      <section aria-label="Your stats" className="reveal">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Charts */}
      <section aria-label="Activity charts" className="reveal delay-75">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CandidateStatusChart stats={data?.stats} />
          <ProfileCompletionChart completion={data?.profileCompletion} />
        </div>
      </section>

      {/* Phase 5 — plan + credits summary */}
      <PlanCard />

      {!data?.profile?.isSkillVerified && (
      <section
        aria-labelledby="skill-test-heading"
        className="reveal delay-100"
      >
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2
                  id="skill-test-heading"
                  className="font-bold text-foreground text-base"
                >
                  Verify Your Skills
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Verified skills help recruiters trust your profile faster.{" "}
                Takes only 10 minutes.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BadgeCheck
                    className="w-3.5 h-3.5 text-emerald-500"
                    aria-hidden="true"
                  />{" "}
                  Badge on your profile
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BadgeCheck
                    className="w-3.5 h-3.5 text-emerald-500"
                    aria-hidden="true"
                  />{" "}
                  Higher match score
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/verification/skill-intro"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 shrink-0"
          >
            <Zap className="w-4 h-4" aria-hidden="true" />
            Take Skill Test
          </Link>
        </div>
      </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section aria-labelledby="applications-heading">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="applications-heading"
                className="text-lg font-bold text-foreground flex items-center gap-2"
              >
                <Clock className="w-5 h-5 text-indigo-500" aria-hidden="true" />{" "}
                Recent Applications
              </h2>
              <Link
                href="/applications"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
              >
                View all <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {recentApplications.length > 0 ? (
                <ul role="list" className="divide-y divide-slate-100">
                  {recentApplications.map((app, i) => {
                    const key = app._id || i;
                    const isExpanded = expandedApps[key];
                    const statusStyle =
                      STATUS_STYLES[app.status] ||
                      "bg-slate-100 text-muted-foreground";
                    return (
                      <li key={key}>
                        <div className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-muted-foreground shrink-0 text-sm"
                              aria-hidden="true"
                            >
                              {(app.company || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">
                                {app.jobTitle}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {app.company} ·{" "}
                                {new Date(app.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${statusStyle}`}
                            >
                              {app.status}
                            </span>
                            <button
                              onClick={() =>
                                setExpandedApps((p) => ({
                                  ...p,
                                  [key]: !p[key],
                                }))
                              }
                              aria-expanded={isExpanded}
                              aria-controls={`pulse-${key}`}
                              aria-label={
                                isExpanded
                                  ? "Collapse timeline"
                                  : "View application timeline"
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div
                            id={`pulse-${key}`}
                            className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50"
                          >
                            <ApplicationPulseTracker application={app} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-12 text-center">
                  <Briefcase
                    className="w-10 h-10 text-muted-foreground mx-auto mb-3"
                    aria-hidden="true"
                  />
                  <p className="text-muted-foreground font-medium text-sm">
                    No applications yet
                  </p>
                  <Link
                    href="/jobs"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Browse jobs{" "}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </section>

          {rejectedWithFeedback.length > 0 && (
            <section aria-labelledby="growth-heading">
              <h2
                id="growth-heading"
                className="text-lg font-bold text-foreground flex items-center gap-2 mb-4"
              >
                <TrendingUp
                  className="w-5 h-5 text-amber-500"
                  aria-hidden="true"
                />{" "}
                Growth Plan
              </h2>
              <div className="space-y-3">
                {rejectedWithFeedback.map((app, i) => (
                  <GrowthFeedbackCard
                    key={app._id || i}
                    feedback={app.feedback}
                    jobTitle={app.jobTitle}
                    company={app.company}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside aria-label="Profile insights">
          <UpcomingInterviews uid={user?.uid} />

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <h3 className="font-bold text-foreground">Profile Strength</h3>

            <div>
              <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                <span>Completion</span>
                <span
                  className={
                    profileCompletion >= 80
                      ? "text-emerald-600 font-bold"
                      : "text-orange-600 font-bold"
                  }
                >
                  {profileCompletion}%
                </span>
              </div>
              <div
                className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={profileCompletion}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Profile ${profileCompletion}% complete`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${profileCompletion >= 80 ? "bg-emerald-500" : "bg-orange-400"}`}
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              {profileCompletion < 80 && (
                <Link
                  href="/profile/edit"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 rounded"
                >
                  Complete profile{" "}
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Quick Links
              </h4>
              <nav aria-label="Candidate quick links">
                <ul className="space-y-1">
                  {[
                    { label: "My Applications", href: "/applications" },
                    { label: "Saved Jobs", href: "/saved-jobs" },
                    { label: "Edit Profile", href: "/profile/edit" },
                    { label: "Skill Tests", href: "/verification/skill-intro" },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 group"
                      >
                        {label}
                        <ChevronRight
                          className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 transition-colors"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                Keeping your profile and skills up to date makes it easier for
                recruiters to find and evaluate you.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
