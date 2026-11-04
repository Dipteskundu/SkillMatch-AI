"use client";

/** Loading skeletons matching the Learning Hub card / list shapes. */
export function PathCardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-100 rounded-3xl p-7 premium-shadow animate-pulse"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100" />
            <div className="h-5 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="h-3 w-24 rounded bg-slate-100 mb-3" />
          <div className="h-5 w-3/4 rounded bg-slate-100 mb-3" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100 h-4 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function InlineSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-slate-100" style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}
