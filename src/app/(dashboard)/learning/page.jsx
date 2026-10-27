"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "../../lib/AuthContext";
import { useGetLearningProgressQuery } from "../../store/api/apiSlice";
import { formatXp, readLearningData } from "../../lib/learning";
import {
  GraduationCap,
  Flame,
  Sparkles,
  Award,
  Trophy,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  ProgressBar,
  Skeleton,
  ErrorNotice,
  ComingSoon,
  SignInPrompt,
} from "../../learn/components/LearnBits";

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Candidate Learning Hub dashboard at /dashboard/learning — XP, streak,
 * enrolled paths, earned badges and recent quiz attempts. All data comes
 * from the server; nothing here is synthesized.
 */
export default function LearningDashboardPage() {
  const { isAuthenticated, role, loading: authLoading } = useAuth();
  const isCandidate = isAuthenticated && role === "candidate";

  const progressQuery = useGetLearningProgressQuery(undefined, { skip: !isAuthenticated });
  const payload = useMemo(() => readLearningData(progressQuery.data), [progressQuery.data]);

  const enrollments = useMemo(
    () => (Array.isArray(payload?.enrollments) ? payload.enrollments.filter(isObject) : []),
    [payload],
  );
  const badges = useMemo(
    () => (Array.isArray(payload?.badges) ? payload.badges.filter(isObject) : []),
    [payload],
  );
  const quizAttempts = useMemo(
    () => (Array.isArray(payload?.quizAttempts) ? payload.quizAttempts.filter(isObject) : []),
    [payload],
  );

  const activePaths = enrollments.filter((e) => !e.completed);
  const completedPaths = enrollments.filter((e) => e.completed);

  const loadFailed =
    progressQuery.isError || Boolean(progressQuery.data && progressQuery.data.success === false);
  const is404 = progressQuery.isError && progressQuery.error?.status === 404;
  const is401 = progressQuery.isError && progressQuery.error?.status === 401;

  const xpLabel = formatXp(payload?.xp);
  const streakDays =
    typeof payload?.streakDays === "number" && payload.streakDays > 0 ? payload.streakDays : null;

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <Skeleton rows={8} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto">
        <SignInPrompt
          title="Sign in to see your learning dashboard"
          href="/signin?redirect=/dashboard/learning"
        />
      </div>
    );
  }

  if (!isCandidate) {
    return (
      <div className="max-w-5xl mx-auto">
        <ComingSoon
          title="The Learning Hub is for candidates"
          text="Learning paths, quizzes and verified skill badges live on the candidate side of the platform."
        />
        <div className="text-center mt-4">
          <Link href="/dashboard" className="text-sm font-bold text-indigo-600 underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              SkillForge
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">My Learning</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Your paths, XP and verified skill badges — all earned, nothing decorative.
          </p>
        </div>
        <Link
          href="/learn"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-700 transition-colors shrink-0"
        >
          Browse paths <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {progressQuery.isLoading && <Skeleton rows={6} />}

      {!progressQuery.isLoading && is401 && (
        <ErrorNotice message="Your session has expired. Sign in again to load your learning progress." />
      )}

      {!progressQuery.isLoading && loadFailed && !is401 && is404 && (
        <ComingSoon
          title="Your learning dashboard is coming online soon"
          text="The server hasn't shipped the progress endpoint yet. Start a path from the Learning Hub and it'll show up here once it's live."
        />
      )}

      {!progressQuery.isLoading && loadFailed && !is401 && !is404 && (
        <ErrorNotice
          message={progressQuery.error?.status
            ? "We couldn't load your learning progress. Please try again."
            : "Couldn't reach the server. Check your connection and try again."}
          onRetry={() => progressQuery.refetch()}
        />
      )}

      {!progressQuery.isLoading && !loadFailed && (
        <div className="space-y-6 pb-10">
          {/* ── XP + streak ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 leading-none">{xpLabel ?? "—"}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Total XP</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 leading-none">
                  {streakDays ? `${streakDays} day${streakDays === 1 ? "" : "s"}` : "—"}
                </p>
                <p className="text-xs font-bold text-slate-400 mt-1">Learning streak</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 leading-none">{badges.length}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Verified badges</p>
              </div>
            </div>
          </div>

          {/* ── Enrolled paths ── */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" aria-label="Learning paths">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Your paths</h2>
            </div>
            {enrollments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                <GraduationCap className="w-7 h-7 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-500 mb-3">
                  You haven&apos;t enrolled in a path yet.
                </p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-700 transition-colors"
                >
                  Browse the Learning Hub <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {activePaths.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                      In progress
                    </p>
                    <ul className="space-y-3">
                      {activePaths.map((enrollment) => (
                        <PathRow key={enrollment.pathId || enrollment.title} enrollment={enrollment} />
                      ))}
                    </ul>
                  </div>
                )}
                {completedPaths.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                      Completed
                    </p>
                    <ul className="space-y-3">
                      {completedPaths.map((enrollment) => (
                        <PathRow key={enrollment.pathId || enrollment.title} enrollment={enrollment} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Badges ── */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" aria-label="Earned badges">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Verified skill badges</h2>
            </div>
            {badges.length === 0 ? (
              <p className="text-sm text-slate-500">
                No badges yet — pass a path&apos;s quiz and the verified skill lands here (and on
                your profile).
              </p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((badge, index) => {
                  const issued = formatDate(badge.at || badge.issuedAt);
                  return (
                    <li
                      key={badge.verifiableCode || badge.skillSlug || index}
                      className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                        <p className="text-sm font-black text-slate-900 truncate">
                          {badge.skillName || badge.skillSlug || "Verified skill"}
                        </p>
                      </div>
                      {issued && (
                        <p className="text-xs font-semibold text-slate-500">Earned {issued}</p>
                      )}
                      {badge.verifiableCode && (
                        <p className="text-[10px] font-mono text-slate-400 mt-1 break-all">
                          {badge.verifiableCode}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ── Recent quiz attempts ── */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" aria-label="Recent quiz attempts">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent quiz attempts</h2>
            </div>
            {quizAttempts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No quiz attempts yet — they&apos;ll appear here after you submit a path quiz.
              </p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {quizAttempts.slice(0, 10).map((attempt, index) => {
                  const when = formatDate(attempt.at || attempt.attemptedAt);
                  const score = typeof attempt.score === "number" ? attempt.score : null;
                  const passed = attempt.passed === true;
                  return (
                    <li key={`${attempt.pathId || attempt.title || "attempt"}-${index}`} className="py-3 flex items-center gap-3">
                      <span
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          passed ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                        }`}
                        aria-hidden="true"
                      >
                        {passed ? <CheckCircle2 className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-slate-800 truncate">
                          {attempt.pathTitle || attempt.title || "Path quiz"}
                        </span>
                        {when && <span className="block text-xs font-semibold text-slate-400">{when}</span>}
                      </span>
                      <span className="shrink-0 flex items-center gap-2">
                        {score !== null && (
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-700">
                            {score}%
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            passed
                              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                              : "bg-amber-50 border-amber-200 text-amber-600"
                          }`}
                        >
                          {passed ? "Passed" : "Retakeable"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="sm:hidden">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-700 transition-colors"
            >
              Browse paths <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function PathRow({ enrollment }) {
  const percent =
    typeof enrollment.percent === "number" && Number.isFinite(enrollment.percent)
      ? enrollment.percent
      : 0;
  const started = formatDate(enrollment.enrolledAt);
  return (
    <li>
      <Link
        href={`/learn/${enrollment.pathId}`}
        className="block rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm font-black text-slate-900 truncate">{enrollment.title}</span>
          {enrollment.completed ? (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Completed
            </span>
          ) : (
            <span className="shrink-0 text-xs font-black text-indigo-600">{Math.round(percent)}%</span>
          )}
        </div>
        {started && (
          <p className="text-xs font-semibold text-slate-400 mb-2">Started {started}</p>
        )}
        <ProgressBar percent={percent} />
      </Link>
    </li>
  );
}
