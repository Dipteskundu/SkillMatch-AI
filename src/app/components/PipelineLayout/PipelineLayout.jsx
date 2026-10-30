"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import {
  Users, Star, FileText, AlignJustify, CalendarDays,
  Clock, CheckCircle2, UserCheck, Briefcase, ChevronDown,
} from "lucide-react";

const PHASES = [
  { key: "applicants",     label: "Applicants",     icon: Users,       path: "/applicants",         statuses: ["submitted"] },
  { key: "shortlisted",    label: "Shortlisted",    icon: Star,        path: "/shortlisted",        statuses: ["shortlisted"] },
  { key: "task-sent",      label: "Task Sent",      icon: FileText,    path: "/task-assignment",    statuses: ["task_sent", "task_accepted"] },
  { key: "submissions",    label: "Submissions",    icon: AlignJustify,path: "/task-submissions",   statuses: ["task_submitted"] },
  { key: "interview-sel",  label: "Interview Sel.", icon: CalendarDays,path: "/interview-selected", statuses: ["interview_selected"] },
  { key: "scheduled",      label: "Scheduled",      icon: Clock,       path: "/interviews",         statuses: ["interviewing", "interview_scheduled"] },
  { key: "completed",      label: "Completed",      icon: CheckCircle2,path: "/interview-completed",statuses: ["interview_completed"] },
  { key: "final-selected", label: "Final Selected", icon: UserCheck,   path: "/final-selected",     statuses: ["final_selected", "hired"] },
];

const PHASE_META = {
  applicants:       { title: "Hiring Pipeline",           subtitle: "Manage and track candidates through your recruitment stages" },
  shortlisted:      { title: "Shortlisted Talent",        subtitle: "Ready for technical evaluation or interview assessment" },
  "task-sent":      { title: "Technical Task Assignment", subtitle: "Define and assign tasks to your shortlisted candidates" },
  submissions:      { title: "Task Submissions",          subtitle: "Review and evaluate technical solutions from your candidates" },
  "interview-sel":  { title: "Interview Selection",       subtitle: "Candidates who passed task review, ready to be scheduled" },
  scheduled:        { title: "Interview Management",      subtitle: "Keep track of your scheduled candidate assessments" },
  completed:        { title: "Completed Interviews",      subtitle: "Evaluate candidates and make your final selections" },
  "final-selected": { title: "Final Selected",            subtitle: "Ready to receive an offer and join your team" },
};

export default function PipelineLayout({ children, activePhase }) {
  const { user } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState("All Jobs");
  const [jobDropOpen, setJobDropOpen] = useState(false);
  const [phaseCounts, setPhaseCounts] = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    apiFetch(`/api/jobs/my-jobs/${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setJobs(d.jobs || []);
          const first = d.jobs?.[0];
          if (first) {
            setSelectedJobId((prev) => {
              if (prev) return prev;
              setSelectedJobTitle(first.title);
              return first._id;
            });
          }
        }
      })
      .catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    apiFetch(`/api/applications/recruiter/${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        const apps = d.applications || [];
        const counts = {};
        PHASES.forEach(phase => {
          counts[phase.key] = apps.filter(a => phase.statuses.includes(a.status)).length;
        });
        setPhaseCounts(counts);
      })
      .catch(() => {});
  }, [user?.uid]);

  const meta = PHASE_META[activePhase] || PHASE_META.applicants;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{meta.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{meta.subtitle}</p>
        </div>

        {/* Active Pipeline Selector */}
        <div className="relative">
          <button
            onClick={() => setJobDropOpen(p => !p)}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow min-w-[200px]"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Active Pipeline</p>
              <p className="text-sm font-bold text-slate-900 truncate">{selectedJobTitle}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${jobDropOpen ? "rotate-180" : ""}`} />
          </button>

          {jobDropOpen && (
            <div className="absolute right-0 mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              {jobs.length === 0 ? (
                <p className="text-sm text-slate-400 p-4 text-center">No jobs posted yet</p>
              ) : (
                <ul className="max-h-52 overflow-y-auto">
                  {jobs.map(job => (
                    <li key={job._id}>
                      <button
                        onClick={() => { setSelectedJobId(job._id); setSelectedJobTitle(job.title); setJobDropOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${selectedJobId === job._id ? "font-bold text-indigo-600 bg-indigo-50" : "text-slate-700"}`}
                      >
                        {job.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phase Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4 mb-6 overflow-x-auto">
        <div className="flex items-center min-w-max mx-auto">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const isActive = phase.key === activePhase;
            const phaseIndex = PHASES.findIndex(p => p.key === activePhase);
            const isDone = idx < phaseIndex;
            const count = phaseCounts[phase.key];

            return (
              <div key={phase.key} className="flex items-center">
                <button
                  onClick={() => router.push(phase.path)}
                  className={`relative flex flex-col items-center gap-1.5 px-3 py-1 rounded-xl transition-all group ${
                    isActive ? "text-indigo-600" : isDone ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {/* Dynamic count badge */}
                  {count > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm ${
                      isActive ? "bg-indigo-600 text-white" : isDone ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"
                    }`}>
                      {count > 99 ? "99+" : count}
                    </span>
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? "bg-indigo-100 shadow-sm" : isDone ? "bg-emerald-50" : "bg-slate-50 group-hover:bg-slate-100"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide leading-tight text-center ${
                    isActive ? "text-indigo-600" : isDone ? "text-emerald-600" : "text-slate-400"
                  }`}>
                    {phase.label}
                  </span>
                </button>

                {idx < PHASES.length - 1 && (
                  <div className={`h-px w-8 mx-1 shrink-0 ${idx < phaseIndex ? "bg-emerald-300" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
