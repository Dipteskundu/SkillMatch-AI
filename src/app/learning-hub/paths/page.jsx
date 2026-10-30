"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import PageWrapper from "../../components/common/PageWrapper";
import PathCard from "../../components/learning/PathCard";
import { PathCardSkeleton } from "../../components/learning/Skeletons";
import { fetchPaths } from "../../lib/learningApi";
import { Search, SearchX, Route } from "lucide-react";

const LEVELS = [
  { value: "", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function LearningPathsPage() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPaths();
        if (!cancelled) setPaths(data);
      } catch {
        if (!cancelled) setError("Could not load learning paths right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return paths.filter((p) => {
      if (level && String(p.level).toLowerCase() !== level) return false;
      if (!q) return true;
      return [p.title, p.topic, p.description, ...(p.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [paths, search, level]);

  const categoryCounts = useMemo(() => {
    const map = new Map();
    paths.forEach((p) => {
      const key = p.category || p.topic || "Other";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [paths]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <PageWrapper>
          {/* ── Header ── */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient" aria-hidden="true" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-12">
              <div className="animate-fade-up">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5">
                  <Route className="w-3.5 h-3.5" aria-hidden="true" />
                  Learning paths
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                  Pick a path. <span className="text-indigo-600">Follow the order.</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                  Curated technical roadmaps with ordered modules, prerequisites,
                  and time estimates. Browse freely — sign in when you&apos;re ready
                  to enroll.
                </p>
              </div>
            </div>
          </section>

          {/* ── Filters ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 premium-shadow flex flex-col lg:flex-row gap-4 lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by topic, technology, or skill…"
                  aria-label="Search learning paths"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by level">
                {LEVELS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLevel(opt.value)}
                    aria-pressed={level === opt.value}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      level === opt.value
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                        : "bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category chips (informational counts) */}
            {categoryCounts.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryCounts.map(([cat, count]) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500"
                  >
                    {cat}
                    <span className="text-indigo-600">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── Grid ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
            {loading && <PathCardSkeleton count={6} />}

            {error && (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center premium-shadow">
                <p className="text-slate-500 mb-5">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center premium-shadow">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-5">
                  <SearchX className="w-7 h-7 text-slate-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No paths match</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Try a different search term or clear your level filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setLevel("");
                  }}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">
                  {filtered.length} {filtered.length === 1 ? "path" : "paths"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((path, i) => (
                    <PathCard key={path._id} path={path} index={i} />
                  ))}
                </div>
              </>
            )}
          </section>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
