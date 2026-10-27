"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "../lib/AuthContext";
import { useGetLearningCatalogQuery } from "../store/api/apiSlice";
import { flattenCatalog, formatXp, readLearningData } from "../lib/learning";
import {
  GraduationCap,
  Flame,
  Award,
  Clock,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  LevelChip,
  ProgressBar,
  CardSkeleton,
  ErrorNotice,
  ComingSoon,
  SignInPrompt,
} from "./components/LearnBits";

/**
 * PUBLIC catalog at /learn — anyone (including guests) can browse paths.
 * Signed-in candidates additionally see their XP / streak / badges strip
 * and per-path progress. Guests get "Sign in to start" on every card.
 */
export default function LearnCatalogPage() {
  const { user, isAuthenticated, role, loading: authLoading } = useAuth();
  const isCandidate = isAuthenticated && role === "candidate";

  const catalogQuery = useGetLearningCatalogQuery();

  const catalog = useMemo(
    () => readLearningData(catalogQuery.data),
    [catalogQuery.data],
  );
  const technologies = useMemo(
    () => (Array.isArray(catalog?.technologies) ? catalog.technologies.filter((t) => t && typeof t === "object") : []),
    [catalog],
  );
  const paths = useMemo(() => flattenCatalog(technologies), [technologies]);
  const badges = useMemo(
    () => (Array.isArray(catalog?.badges) ? catalog.badges : []),
    [catalog],
  );

  // apiClient resolves HTTP 500s, so a "successful" response can still fail.
  const loadFailed =
    catalogQuery.isError || Boolean(catalogQuery.data && catalogQuery.data.success === false);
  const is404 = catalogQuery.isError && catalogQuery.error?.status === 404;
  const is401 = catalogQuery.isError && catalogQuery.error?.status === 401;
  const isEmpty = !loadFailed && !catalogQuery.isLoading && technologies.length === 0;

  const xpLabel = formatXp(catalog?.xp);
  const streakDays =
    typeof catalog?.streakDays === "number" && catalog.streakDays > 0 ? catalog.streakDays : null;

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Hero ── */}
        <section className="rounded-[2rem] bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-8 sm:p-10 mb-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">
              SkillForge Learning Hub
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
            Find your gap. Learn it. Prove it.
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
            Short lessons (under 10 minutes each) and a server-graded quiz per path. Pass the
            quiz and you earn a verified skill badge that counts toward your Hiring Fit Score —
            no badges or progress are shown that you haven&apos;t actually earned.
          </p>
          {!authLoading && !isCandidate && (
            <div className="mt-5">
              <Link
                href="/signin?redirect=/learn"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
              >
                Sign in to start learning <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* ── XP / streak / badges strip (signed-in candidates only) ── */}
        {!authLoading && isCandidate && !loadFailed && catalog && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Link
              href="/dashboard/learning"
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-indigo-200 transition-colors"
            >
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 leading-none">{xpLabel ?? "—"}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Total XP earned</p>
              </div>
            </Link>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 leading-none">
                  {streakDays ? `${streakDays} day${streakDays === 1 ? "" : "s"}` : "—"}
                </p>
                <p className="text-xs font-bold text-slate-400 mt-1">Learning streak</p>
              </div>
            </div>
            <Link
              href="/dashboard/learning"
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-indigo-200 transition-colors"
            >
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 leading-none">
                  {badges.length} earned
                </p>
                <p className="text-xs font-bold text-slate-400 mt-1">Verified skill badges</p>
              </div>
            </Link>
          </div>
        )}

        {/* ── Catalog ── */}
        {catalogQuery.isLoading && <CardSkeleton cards={6} />}

        {!catalogQuery.isLoading && is401 && !isAuthenticated && (
          <SignInPrompt
            text="Sign in to see the full learning catalog, track progress and earn verified skill badges. Browsing stays open to everyone once the catalog is live."
          />
        )}

        {!catalogQuery.isLoading && loadFailed && !is401 && is404 && (
          <ComingSoon text="The SkillForge catalog is being wired up on the server. Course paths will appear here as soon as it's live — nothing is faked in the meantime." />
        )}

        {!catalogQuery.isLoading && loadFailed && !is401 && !is404 && (
          <ErrorNotice
            message={
              catalogQuery.error?.status
                ? "We couldn't load the learning catalog. Please try again."
                : "Couldn't reach the server. Check your connection and try again."
            }
            onRetry={() => catalogQuery.refetch()}
          />
        )}

        {!catalogQuery.isLoading && is401 && isAuthenticated && (
          <ErrorNotice
            message="Your session has expired. Sign in again to load your learning progress."
          />
        )}

        {isEmpty && (
          <ComingSoon
            title="The catalog is being built"
            text="Flagship paths (React, Python, SQL, System Design, Communication) are on the way. Check back soon."
          />
        )}

        {!loadFailed && technologies.length > 0 && (
          <div className="space-y-8 pb-10">
            {technologies.map((tech) => {
              const techPaths = (Array.isArray(tech.paths) ? tech.paths : []).filter(
                (p) => p && typeof p === "object",
              );
              if (techPaths.length === 0) return null;
              return (
                <section key={tech._id || tech.name} aria-label={`${tech.name} learning paths`}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-black text-slate-900">{tech.name}</h2>
                    {typeof tech.category === "string" && tech.category && (
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {tech.category}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-400">
                      {techPaths.length} path{techPaths.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {techPaths.map((path) => (
                      <PathCard
                        key={path._id}
                        path={path}
                        isAuthenticated={isAuthenticated}
                        authLoading={authLoading}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PathCard({ path, isAuthenticated, authLoading }) {
  const enrolled = Boolean(path.enrolled);
  const completed = Boolean(path.completed);
  const percent =
    typeof path.progressPercent === "number" && Number.isFinite(path.progressPercent)
      ? Math.min(100, Math.max(0, Math.round(path.progressPercent)))
      : 0;

  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:border-indigo-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-black text-slate-900 leading-snug">{path.title}</h3>
        <LevelChip level={path.level} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
        {typeof path.estimatedHours === "number" && (
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            ~{path.estimatedHours}h
          </span>
        )}
        {typeof path.lessonCount === "number" && (
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            {path.lessonCount} lessons
          </span>
        )}
        {typeof path.quizQuestionCount === "number" && (
          <span className="inline-flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            {path.quizQuestionCount} quiz Qs
          </span>
        )}
      </div>

      {enrolled && <ProgressBar percent={percent} label="Your progress" />}

      <div className="mt-auto pt-1">
        {authLoading ? (
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
            <Sparkles className="w-3.5 h-3.5" /> Checking your access…
          </span>
        ) : !isAuthenticated ? (
          <Link
            href={`/signin?redirect=/learn/${path._id}`}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-200 px-4 py-2 text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Sign in to start
          </Link>
        ) : completed ? (
          <Link
            href={`/learn/${path._id}`}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </Link>
        ) : enrolled ? (
          <Link
            href={`/learn/${path._id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 transition-colors"
          >
            Continue {percent > 0 ? `(${percent}%)` : ""} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href={`/learn/${path._id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 transition-colors"
          >
            Start <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
