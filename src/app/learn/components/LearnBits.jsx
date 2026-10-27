"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Loader2,
  RefreshCw,
  Construction,
} from "lucide-react";

/* Small presentational building blocks shared by the Learning Hub pages.
 * Everything follows the app's light / indigo design language. */

const LEVEL_STYLES = {
  beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  intermediate: "bg-indigo-50 text-indigo-600 border-indigo-200",
  advanced: "bg-amber-50 text-amber-700 border-amber-200",
};

export function LevelChip({ level }) {
  const key = typeof level === "string" ? level.toLowerCase() : "";
  const className = LEVEL_STYLES[key] || "bg-slate-50 text-slate-600 border-slate-200";
  const label = typeof level === "string" && level ? level : "Level n/a";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${className}`}>
      {label}
    </span>
  );
}

export function ProgressBar({ percent, label }) {
  const raw = typeof percent === "number" && Number.isFinite(percent) ? percent : 0;
  const value = Math.min(100, Math.max(0, Math.round(raw)));
  return (
    <div>
      {label !== undefined && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
          <span className="text-xs font-black text-slate-700">{value}%</span>
        </div>
      )}
      <div
        className="h-1.5 bg-slate-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${value} percent` : `${value} percent complete`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${value >= 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function Skeleton({ rows = 3, className = "" }) {
  return (
    <div className={`animate-pulse space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`h-3.5 bg-slate-100 rounded ${index === 0 ? "w-3/4" : index % 2 ? "w-full" : "w-5/6"}`}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ cards = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-9 bg-slate-100 rounded-xl w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
        <p className="text-sm font-semibold text-rose-700 flex-1">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

/** Honest empty state for "the backend for this doesn't exist yet". */
export function ComingSoon({ title = "Coming online soon", text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <div className="inline-flex text-slate-300 mb-3">
        <Construction className="w-8 h-8" />
      </div>
      <p className="text-sm font-black text-slate-600 mb-1">{title}</p>
      {text && <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">{text}</p>}
    </div>
  );
}

export function SignInPrompt({ title = "Sign in to start learning", text, href = "/signin?redirect=/learn" }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-8 text-center">
      <div className="inline-flex p-2 bg-indigo-100 rounded-xl mb-3">
        <GraduationCap className="w-5 h-5 text-indigo-600" />
      </div>
      <p className="text-sm font-black text-slate-800 mb-1">{title}</p>
      {text && <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-4">{text}</p>}
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-indigo-700"
      >
        Sign in <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export function InlineSpinner({ label }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> {label}
    </span>
  );
}
