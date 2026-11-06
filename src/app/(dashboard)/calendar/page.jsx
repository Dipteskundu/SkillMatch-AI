"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import api, { API_BASE } from "../../lib/apiClient";
import dynamic from "next/dynamic";
import { Loader2, CalendarDays } from "lucide-react";

// Dynamically import to avoid SSR issues with react-big-calendar
const InterviewCalendar = dynamic(
  () => import("../../components/InterviewCalendar/InterviewCalendar"),
  { ssr: false, loading: () => <CalendarSkeleton /> }
);

function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-48 mb-6" />
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[...Array(7)].map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded" />)}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-1 mb-1">
          {[...Array(7)].map((_, j) => <div key={j} className="h-16 bg-slate-50 rounded border border-slate-100" />)}
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const { user, role, isAuthenticated } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid || !role) return;

    const fetchData = async () => {
      try {
        const endpoint = role === "recruiter"
          ? `/api/interviews/recruiter/${user.uid}`
          : `/api/interviews/candidate/${user.uid}`;

        const res = await api.get(endpoint);
        const data = res.data;
        if (data.success) setInterviews(data.interviews || []);
      } catch (err) {
        console.error("Failed to fetch calendar data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, role]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen theme-page-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interview Calendar</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {role === "recruiter"
                ? "All your scheduled candidate interviews at a glance"
                : "Your upcoming and past interview schedule"}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total",     value: interviews.length,                                                          color: "text-slate-700",   bg: "bg-white" },
              { label: "Upcoming",  value: interviews.filter(i => i.status === "scheduled" && new Date(i.scheduledDateTime || i.scheduledAt) > new Date()).length, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Completed", value: interviews.filter(i => i.status === "completed").length,                    color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Cancelled", value: interviews.filter(i => i.status === "cancelled").length,                    color: "text-red-500",     bg: "bg-red-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3`}>
                <div>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calendar */}
        {loading ? (
          <CalendarSkeleton />
        ) : (
          <InterviewCalendar interviews={interviews} role={role} />
        )}
      </div>
    </div>
  );
}
