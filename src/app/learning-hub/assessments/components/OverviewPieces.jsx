"use client";

/**
 * Shared pieces for the My Assessments pages (overview, stat detail pages,
 * result viewer): the auth gate, animated stat card, course card, attempt
 * history table, and small formatting helpers.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { useAuth } from "../../../lib/AuthContext";
import { signInUrlWithReturn } from "../../../lib/redirect";
import { formatDuration } from "../../../lib/learningApi";
import {
  ArrowRight,
  PlayCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ── Auth gate ────────────────────────────────────────────────────────────────

/**
 * Wraps any private Learning Hub page: blocks render until auth resolves,
 * sends guests to sign-in with a safe return path (LH-004), then mounts the
 * dashboard chrome around the children.
 */
export function PrivateGate({ children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && typeof window !== "undefined") {
      const { pathname, search } = window.location;
      window.location.assign(signInUrlWithReturn(`${pathname}${search}`));
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }
  if (!user) return null; // sign-in redirect in flight

  return <DashboardLayout>{children}</DashboardLayout>;
}

// ── Count-up hook ────────────────────────────────────────────────────────────

/**
 * Animates a number from 0 to `target` on mount (ease-out cubic).
 * Respects prefers-reduced-motion and falls back to the static value
 * when `enabled` is false.
 */
export function useCountUp(target, { suffix = "", enabled = true, duration = 900 } = {}) {
  const [value, setValue] = useState(() => (enabled ? 0 : Number(target) || 0));
  const num = Number(target) || 0;

  useEffect(() => {
    if (!enabled) {
      setValue(num);
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(num);
      return;
    }
    let raf = null;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(num * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [num, duration, enabled]);

  return `${value}${suffix}`;
}

// ── Stat card (clickable, animated) ──────────────────────────────────────────

/** Numeric value + optional suffix ("%""). Renders as a link when href given. */
export function StatCard({ label, value, suffix = "", icon: Icon, bg, color, href, countUp = false }) {
  const shown = useCountUp(value, { suffix, enabled: countUp });
  const inner = (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex items-center gap-4 transition-all duration-200 h-full ${
        href ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 group" : "hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className={`${bg} ${color} p-3 rounded-xl shrink-0 ${href ? "group-hover:scale-105 transition-transform" : ""}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 leading-none" aria-label={`${label}: ${value}${suffix}`}>
          {shown}
        </p>
        <p className="text-xs text-slate-500 font-semibold mt-1">{label}</p>
      </div>
      {href && (
        <ArrowRight
          className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all ml-auto"
          aria-hidden="true"
        />
      )}
    </div>
  );
  if (href) {
    return (
      <Link href={href} aria-label={`${label}: ${shown}`}>
        {inner}
      </Link>
    );
  }
  return inner;
}

/** Large hero number used on the stat detail pages. */
export function HeroStat({ value, suffix = "", label, tone = "indigo" }) {
  const tones = {
    indigo: { box: "bg-indigo-50 border-indigo-200", text: "text-indigo-600" },
    emerald: { box: "bg-emerald-50 border-emerald-200", text: "text-emerald-600" },
    amber: { box: "bg-amber-50 border-amber-200", text: "text-amber-500" },
  };
  const t = tones[tone] || tones.indigo;
  return (
    <div className={`rounded-2xl border p-6 sm:p-8 text-center ${t.box}`}>
      <p className={`text-4xl sm:text-5xl font-black ${t.text}`}>{value}{suffix}</p>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2">{label}</p>
    </div>
  );
}

// ── Section title ────────────────────────────────────────────────────────────

export function SectionTitle({ icon: Icon, title, hint }) {
  return (
    <div>
      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
        <Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        {title}
      </h2>
      {hint && <p className="text-xs text-slate-500 font-medium mt-0.5">{hint}</p>}
    </div>
  );
}

// ── Attempt history table ────────────────────────────────────────────────────

/**
 * The tracked-attempts table. `limit` caps visible rows (with a footnote);
 * omit it for the full history.
 */
export function AttemptHistoryTable({ attempts = [], limit = null }) {
  const rows = limit ? attempts.slice(0, limit) : attempts;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <Th>Skill</Th>
              <Th>Type</Th>
              <Th>Date</Th>
              <Th>Score</Th>
              <Th>Status</Th>
              <Th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const done = typeof a.score === "number";
              return (
                <tr key={a.attemptId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                  <Td className="font-bold text-slate-800">{a.skill || "Assessment"}</Td>
                  <Td>
                    <span className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold uppercase tracking-wider">
                      {typeLabel(a.type)}
                    </span>
                  </Td>
                  <Td className="text-slate-500">{fmtDate(a.startedAt)}</Td>
                  <Td className={done ? scoreClass(a.score) : "text-slate-400"}>
                    {done ? `${a.score}%` : "—"}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        done
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                    >
                      {done ? "Completed" : "In progress"}
                    </span>
                  </Td>
                  <Td className="text-right">
                    {done && (
                      <Link
                        href={`/learning-hub/assessments/results/${a.attemptId}`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                      >
                        View result
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {limit && attempts.length > limit && (
        <p className="px-5 py-3 text-xs font-semibold text-slate-400 border-t border-slate-100">
          Showing your {limit} most recent attempts.
        </p>
      )}
    </div>
  );
}

// ── Course card ──────────────────────────────────────────────────────────────

export function CourseCard({ plan, index = 0 }) {
  const isDraft = plan.status === "draft";
  const progress = plan.progress || { percent: 0, completedLessons: 0, totalLessons: 0 };

  const doneSet = new Set((plan.completedLessonIds || []).map(String));
  const nextLesson = (plan.modules || [])
    .flatMap((m) => m.lessons || [])
    .find((l) => !doneSet.has(String(l.lessonId)));
  const continueHref = !isDraft && nextLesson
    ? `/learning-hub/lesson?lesson=${encodeURIComponent(nextLesson.lessonId)}&plan=${plan._id}`
    : "/learning-hub/my-learning";

  const state = isDraft
    ? { label: "Not started", chip: "bg-slate-100 text-slate-500 border-slate-200" }
    : progress.percent === 0
      ? { label: "Enrolled", chip: "bg-blue-50 text-blue-600 border-blue-100" }
      : { label: "In progress", chip: "bg-indigo-50 text-indigo-600 border-indigo-100" };

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow animate-card-rise"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-black text-slate-900 leading-snug min-w-0" title={plan.title}>
          {truncate(plan.title, 52)}
        </h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${state.chip}`}>
          {state.label}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
          <span className="text-xs font-black text-indigo-600">{progress.percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-semibold">
          {progress.completedLessons} of {progress.totalLessons} lessons done
          {plan.weeklyHours ? ` · ${plan.weeklyHours} h/week` : ` · ${formatDuration(plan)}`}
        </p>
      </div>

      {nextLesson && !isDraft && (
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <PlayCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" aria-hidden="true" />
          Next: {truncate(nextLesson.title, 40)}
        </p>
      )}
      {isDraft && (
        <p className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Draft — finish the setup wizard to activate
        </p>
      )}

      <div className="mt-auto pt-1 flex gap-2">
        <Link
          href={continueHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          {isDraft ? "Review plan" : progress.percent === 0 ? "Start course" : "Resume"}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
        <Link
          href="/learning-hub/my-learning"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
        >
          Details
        </Link>
      </div>
    </div>
  );
}

// ── Formatting helpers ───────────────────────────────────────────────────────

const TYPE_LABELS = {
  diagnostic: "Diagnostic",
  module: "Module",
  lesson: "Lesson check",
  lesson_check: "Lesson check",
  standalone: "Standalone",
  final: "Final",
};

export function typeLabel(type) {
  if (!type) return "Assessment";
  return TYPE_LABELS[type] || String(type).replace(/[_-]/g, " ");
}

export function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function scoreClass(score) {
  if (score >= 60) return "font-black text-emerald-600";
  if (score >= 40) return "font-black text-amber-500";
  return "font-black text-red-500";
}

export function scoreTone(score) {
  if (score >= 60) return { bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-600" };
  if (score >= 40) return { bg: "bg-amber-50 border border-amber-200", text: "text-amber-500" };
  return { bg: "bg-red-50 border border-red-200", text: "text-red-500" };
}

export function truncate(text, max) {
  const s = String(text || "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function Th({ children, ...rest }) {
  return (
    <th scope="col" className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

export function Td({ children, className = "", ...rest }) {
  return <td className={`px-5 py-3.5 ${className}`}>{children}</td>;
}
