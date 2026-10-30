"use client";

import Link from "next/link";
import {
  Clock,
  Layers,
  BookOpen,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatDuration } from "../../lib/learningApi";

const LEVEL_STYLES = {
  beginner: "bg-emerald-50 text-emerald-700 border-emerald-100",
  intermediate: "bg-amber-50 text-amber-700 border-amber-100",
  advanced: "bg-rose-50 text-rose-700 border-rose-100",
};

/**
 * A single learning path card for the public catalog.
 * Entire card links to the detail page; optional actions render inside.
 */
export default function PathCard({ path, index = 0 }) {
  const level = String(path?.level || "beginner").toLowerCase();
  const levelClass =
    LEVEL_STYLES[level] ||
    "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <Link
      href={`/learning-hub/paths/${path.slug || path._id}`}
      className="group relative flex flex-col bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 premium-shadow card-hover overflow-hidden animate-fade-up focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {/* Accent glow */}
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-indigo-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Sparkles className="w-6 h-6 text-indigo-600" aria-hidden="true" />
        </div>
        <span
          className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${levelClass}`}
        >
          {path?.level || "beginner"}
        </span>
      </div>

      <div className="relative flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          {path?.topic}
        </p>
        <h3 className="text-xl font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
          {path?.title}
        </h3>
        <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-3">
          {path?.description}
        </p>
      </div>

      {Array.isArray(path?.prerequisites) && path.prerequisites.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {path.prerequisites.slice(0, 3).map((prereq) => (
            <span
              key={prereq}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-500"
            >
              {prereq}
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
            {path?.moduleCount ?? path?.modules?.length ?? 0} modules
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
            {path?.lessonCount ?? 0} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
            {formatDuration(path)}
          </span>
        </div>
        <ChevronRight
          className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
