"use client";

/**
 * My Assessments — the candidate's learning dashboard overview.
 *
 * Composes existing endpoints client-side:
 *  - GET /api/v1/learning/my-plans        → courses + 56-day activity
 *  - GET /api/v1/assessments/summary      → attempts, metrics, topic performance
 *  - GET /api/v1/learning/recommendations → adaptive suggestions (optional)
 *
 * Login is required unconditionally; guests are sent to sign-in with a
 * safe return path (LH-004) instead of bouncing through the dashboard.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchMyPlansWithActivity,
  fetchAssessmentSummary,
  fetchLearningRecommendations,
} from "../../lib/learningApi";
import {
  LearningScoreTrendChart,
  LearningTopicChart,
  LearningProgressRings,
  LearningActivityChart,
} from "../../dashboard/components/DashboardCharts";
import {
  PrivateGate,
  StatCard,
  SectionTitle,
  CourseCard,
  AttemptHistoryTable,
  truncate,
} from "./components/OverviewPieces";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Target,
  Trophy,
  Award,
  Flame,
  Lock,
  Lightbulb,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileText,
  PlayCircle,
  GraduationCap,
} from "lucide-react";
import { deriveWeeklyBuckets, computeWeeklyStreak } from "../../lib/learningAnalytics";

export default function MyAssessmentsPage() {
  return (
    <PrivateGate>
      <AssessmentsOverview />
    </PrivateGate>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

function AssessmentsOverview() {
  const [plans, setPlans] = useState([]);
  const [activity, setActivity] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Partial failure tolerable: charts/sections degrade per-bucket.
      const [plansRes, summaryRes] = await Promise.allSettled([
        fetchMyPlansWithActivity(),
        fetchAssessmentSummary(),
      ]);
      if (cancelled) return;
      let fatal = true;
      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value.plans);
        setActivity(plansRes.value.activity);
        fatal = false;
      }
      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value);
        fatal = false;
      }
      if (fatal) setError("Could not load your learning data. Please try again later.");
      setLoading(false);
      try {
        const recData = await fetchLearningRecommendations();
        if (!cancelled && recData?.recommendations) setRecs(recData.recommendations);
      } catch {
        /* recommendations are optional polish */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const derived = useDerived(plans, summary, activity);
  const {
    attempts,
    scored,
    inProgress,
    drafts,
    notStarted,
    completed,
    weekly,
    streak,
    primaryPlan,
    resumeLesson,
    weakTopics,
    banner,
  } = derived;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6" aria-busy="true" aria-label="Loading your learning overview">
        <div className="h-10 w-64 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  const emptyAccount = plans.length === 0 && attempts.length === 0;
  const topics = summary?.topicPerformance || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="animate-fade-up">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Target className="w-7 h-7 text-indigo-600" aria-hidden="true" />
          My Assessments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track your courses, study activity, scores, and the gaps worth closing next.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-white border border-red-100 p-4 text-sm font-semibold text-red-600 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* ── Empty account: nothing studied yet ── */}
      {!error && emptyAccount && !loading && (
        <EmptyAccount />
      )}

      {!emptyAccount && (
        <>
          {/* ── Smart next action ── */}
          {banner && (
            <div
              className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 animate-card-rise"
              style={{ animationDelay: "60ms" }}
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600">
                {banner.icon === "flame" ? (
                  <Flame className="w-5 h-5" aria-hidden="true" />
                ) : banner.icon === "restart" ? (
                  <PlayCircle className="w-5 h-5" aria-hidden="true" />
                ) : banner.icon === "verify" ? (
                  <Lightbulb className="w-5 h-5" aria-hidden="true" />
                ) : banner.icon === "next" ? (
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">
                  {banner.eyebrow}
                </p>
                <p className="text-sm font-semibold text-slate-800">{banner.text}</p>
              </div>
              <Link
                href={banner.href}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                {banner.action}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* ── Stat cards (clickable → detail pages) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="animate-card-rise">
              <StatCard
                href="/learning-hub/assessments/stats/attempts"
                countUp
                label="Total attempts"
                value={summary?.totalAttempts ?? 0}
                icon={ClipboardCheck}
                bg="bg-indigo-100"
                color="text-indigo-600"
              />
            </div>
            <div className="animate-card-rise" style={{ animationDelay: "70ms" }}>
              <StatCard
                href="/learning-hub/assessments/stats/average"
                countUp
                suffix="%"
                label="Average score"
                value={summary?.averageScore ?? 0}
                icon={Trophy}
                bg="bg-emerald-100"
                color="text-emerald-600"
              />
            </div>
            <div className="animate-card-rise" style={{ animationDelay: "140ms" }}>
              <StatCard
                href="/learning-hub/assessments/stats/best"
                countUp
                suffix="%"
                label="Best score"
                value={summary?.bestScore ?? 0}
                icon={Award}
                bg="bg-amber-100"
                color="text-amber-600"
              />
            </div>
            <div className="animate-card-rise" style={{ animationDelay: "210ms" }}>
              <StatCard
                href="/learning-hub/assessments/stats/courses"
                countUp
                label="Courses in progress"
                value={inProgress.length}
                icon={BookOpen}
                bg="bg-violet-100"
                color="text-violet-600"
              />
            </div>
          </div>

          {/* ── Charts row 1 — empty score-trend slot is filled by the gaps panel ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="animate-card-rise" style={{ animationDelay: "120ms" }}>
              {scored.length ? (
                <LearningScoreTrendChart attempts={scored} />
              ) : (
                <KnowledgeGapsSection weakTopics={weakTopics} recs={recs} narrow />
              )}
            </div>
            <div className="animate-card-rise" style={{ animationDelay: "190ms" }}>
              <LearningActivityChart weekly={weekly} />
            </div>
          </div>

          {/* ── Charts row 2 — empty topic slot is filled by the This week card ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="animate-card-rise" style={{ animationDelay: "190ms" }}>
              {topics.length ? (
                <LearningTopicChart topics={topics} />
              ) : (
                <WeeklyGoalCard weekly={weekly} streak={streak} plan={primaryPlan} />
              )}
            </div>
            <div className="animate-card-rise" style={{ animationDelay: "260ms" }}>
              <div className="space-y-4">
                <LearningProgressRings plans={[...inProgress, ...drafts, ...notStarted]} />
                {topics.length > 0 && (
                  <WeeklyGoalCard weekly={weekly} streak={streak} plan={primaryPlan} />
                )}
              </div>
            </div>
          </div>

          {/* ── Knowledge gaps (live here once a score trend occupies the chart slot) ── */}
          {scored.length > 0 && (
            <div className="animate-card-rise" style={{ animationDelay: "300ms" }}>
              <KnowledgeGapsSection weakTopics={weakTopics} recs={recs} />
            </div>
          )}

          {/* ── Ongoing courses ── */}
          <section className="space-y-4">
            <SectionTitle
              icon={BookOpen}
              title="Your courses"
              hint="Everything you enrolled in or generated with AI — resume where you left off."
            />
            {plans.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center gap-4 text-center animate-fade-up">
                <GraduationCap className="w-8 h-8 text-indigo-600" aria-hidden="true" />
                <p className="text-sm text-slate-500 font-medium max-w-sm">
                  You have no learning plans yet. Answer five questions and the Learning Hub
                  builds a roadmap around your skills and schedule.
                </p>
                <Link
                  href="/learning-hub/create-plan"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  Create My Learning Plan
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...inProgress, ...drafts, ...notStarted].map((plan, i) => (
                  <CourseCard key={plan._id} plan={plan} index={i} />
                ))}
                {!inProgress.length && !drafts.length && !notStarted.length && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm font-bold text-emerald-600 flex items-center justify-center gap-2 lg:col-span-2 animate-fade-up">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    All your courses are complete. Outstanding work!
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Achievements ── */}
          <section className="space-y-4">
            <SectionTitle
              icon={Trophy}
              title="Milestones"
              hint="Small badges that unlock as you learn — keep the streak alive."
            />
            <AchievementsGrid
              summary={summary}
              scored={scored}
              plans={plans}
              completedCount={completed.length}
              streak={streak}
            />
          </section>

          {/* ── Assessment history ── */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <SectionTitle
                icon={FileText}
                title="Assessment history"
                hint="Every tracked attempt — scores are private to you."
              />
              <Link
                href="/learning-hub/paths"
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pb-2"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                New practice
              </Link>
            </div>

            {attempts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center animate-fade-up">
                <ClipboardCheck className="w-8 h-8 text-indigo-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-900 mb-1">No assessments yet</p>
                <p className="text-sm text-slate-500 font-medium max-w-md mx-auto mb-5">
                  Take your first skill check — module, diagnostic, or standalone. Results,
                  topic breakdowns, and revision links show up here.
                </p>
                <Link
                  href="/learning-hub/paths"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                >
                  <Target className="w-4 h-4" aria-hidden="true" />
                  Take your first assessment
                </Link>
              </div>
            ) : (
              <AttemptHistoryTable attempts={attempts} limit={15} />
            )}
          </section>

          {/* ── Completed courses ── */}
          {completed.length > 0 && (
            <section className="space-y-4">
              <SectionTitle
                icon={Award}
                title="Completed courses"
                hint="100% done — revise anytime or unlock the next path."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completed.map((plan, i) => (
                  <div
                    key={plan._id}
                    className="bg-white rounded-2xl border border-emerald-100 p-5 flex flex-col gap-2 card-hover animate-card-rise"
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden="true" />
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-black">
                        100%
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug">{plan.title}</p>
                    <p className="text-xs text-slate-400 font-semibold flex-1">
                      {plan.lessonCount || plan.progress?.totalLessons || 0} lessons completed
                    </p>
                    <Link
                      href="/learning-hub/my-learning"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1.5"
                    >
                      Review course
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ── Data derivation ───────────────────────────────────────────────────────────

function useDerived(plans, summary, activity) {
  return useMemo(() => {
    const attempts = summary?.attempts || [];
    const scored = attempts.filter((a) => typeof a.score === "number");

    const percent = (p) => p.progress?.percent ?? 0;
    const inProgress = plans.filter(
      (p) => p.status !== "draft" && percent(p) > 0 && percent(p) < 100,
    );
    const drafts = plans.filter((p) => p.status === "draft");
    const enrolledNotStarted = plans.filter(
      (p) => p.status !== "draft" && percent(p) === 0,
    );
    const completedPlans = plans.filter((p) => percent(p) === 100);

    const weekly = deriveWeeklyBuckets(activity, attempts);
    const streak = computeWeeklyStreak(weekly);

    // Primary plan = the active course the learner is furthest along in.
    const candidates = [...inProgress, ...enrolledNotStarted];
    const primaryPlan =
      candidates.sort((a, b) => percent(b) - percent(a))[0] || null;

    // Same resume logic as My Learning: first lesson in plan order not done.
    let resumeLesson = null;
    let resumeHref = null;
    if (primaryPlan) {
      const doneSet = new Set((primaryPlan.completedLessonIds || []).map(String));
      const next = (primaryPlan.modules || [])
        .flatMap((m) => m.lessons || [])
        .find((l) => !doneSet.has(String(l.lessonId)));
      if (next) {
        resumeLesson = next;
        resumeHref = `/learning-hub/lesson?lesson=${encodeURIComponent(
          next.lessonId,
        )}&plan=${primaryPlan._id}`;
      }
    }

    const weakTopics = (summary?.topicPerformance || []).filter(
      (t) => t.percent != null && t.percent < 60,
    );

    const weekLessons = weekly[weekly.length - 1]?.lessons || 0;
    const thisWeekActive = weekLessons > 0;

    const banner = buildBanner({
      drafts,
      resumeHref,
      resumeLesson,
      primaryPlan,
      weakTopics,
      attempts,
      plans,
      streak,
      thisWeekActive,
    });

    return {
      attempts,
      scored,
      inProgress,
      drafts,
      notStarted: enrolledNotStarted,
      completed: completedPlans,
      weekly,
      streak,
      primaryPlan,
      resumeLesson,
      weakTopics,
      banner,
    };
  }, [plans, summary, activity]);
}

function buildBanner({
  drafts,
  resumeHref,
  resumeLesson,
  primaryPlan,
  weakTopics,
  attempts,
  plans,
  streak,
  thisWeekActive,
}) {
  if (drafts.length > 0) {
    return {
      eyebrow: "Finish setup",
      text: "You have a draft plan waiting — review its answers and save to make it live.",
      href: "/learning-hub/my-learning",
      action: "Review draft",
      icon: "next",
    };
  }
  if (resumeHref && resumeLesson) {
    return {
      eyebrow: streak > 0 ? "Keep your streak alive" : "Pick up where you left off",
      text: `Continue "${primaryPlan.title}" — next: ${truncate(resumeLesson.title, 60)}.`,
      href: resumeHref,
      action: streak > 0 ? "Keep going" : "Resume",
      icon: "restart",
    };
  }
  if (weakTopics.length > 0) {
    return {
      eyebrow: "Close your gaps",
      text: `You struggled with ${weakTopics.slice(0, 3).map((t) => t.topic).join(", ")} — a quick review will fix it.`,
      href: "#gaps",
      action: "See recommendations",
      icon: "verify",
    };
  }
  if (attempts.length === 0 && plans.length > 0) {
    return {
      eyebrow: "Verify what you learned",
      text: "Your lessons are in progress — take an assessment to check what stuck.",
      href: "/learning-hub/paths",
      action: "Take assessment",
      icon: "default",
    };
  }
  if (attempts.length === 0 && plans.length === 0) {
    return {
      eyebrow: "Get started",
      text: "Create a personalized plan or enroll in a path to begin your learning journey.",
      href: "/learning-hub/create-plan",
      action: "Create plan",
      icon: "next",
    };
  }
  if (!thisWeekActive) {
    return {
      eyebrow: "Momentum check",
      text: "No lessons this week yet — even one 15-minute lesson keeps the streak alive.",
      href: "/learning-hub/my-learning",
      action: "Resume learning",
      icon: "flame",
    };
  }
  return null;
}

// ── Small presentational pieces ──────────────────────────────────────────────

function AchievementsGrid({ summary, scored, plans, completedCount, streak }) {
  const lessonsDone = plans.reduce((n, p) => n + (p.progress?.completedLessons || 0), 0);
  const tiles = [
    { icon: ClipboardCheck, label: "First assessment", unlocked: (summary?.totalAttempts || 0) > 0 },
    { icon: Trophy, label: "First pass · 60%+", unlocked: scored.some((a) => a.score >= 60) },
    { icon: Target, label: "5 tests taken", unlocked: (summary?.totalAttempts || 0) >= 5 },
    { icon: BookOpen, label: "10 lessons done", unlocked: lessonsDone >= 10 },
    { icon: Flame, label: `${streak >= 2 ? streak : 2}-week streak`, iconExtra: "flame", unlocked: streak >= 2 },
    { icon: Award, label: "Course completed", unlocked: completedCount > 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {tiles.map(({ icon: Icon, label, unlocked, iconExtra }, i) => (
        <div
          key={label}
          className={`rounded-2xl border p-4 text-center animate-card-rise ${
            unlocked
              ? "bg-gradient-to-br from-indigo-50 to-white border-indigo-100"
              : "bg-slate-50 border-slate-100 opacity-70"
          }`}
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
        >
          <div className="flex items-center justify-center mb-2">
            {unlocked ? (
              iconExtra === "flame" ? (
                <Flame className="w-6 h-6 text-amber-500 animate-badge-pop" aria-hidden="true" />
              ) : (
                <Icon className="w-6 h-6 text-indigo-600 animate-badge-pop" aria-hidden="true" />
              )
            ) : (
              <Lock className="w-5 h-5 text-slate-300" aria-hidden="true" />
            )}
          </div>
          <p className={`text-[11px] font-bold uppercase tracking-wider leading-tight ${unlocked ? "text-slate-700" : "text-slate-400"}`}>
            {iconExtra === "flame" ? (streak >= 2 ? `${streak}-week streak` : "2-week streak") : label}
          </p>
        </div>
      ))}
    </div>
  );
}

function KnowledgeGapsSection({ weakTopics, recs, narrow }) {
  return (
    <div id="gaps" className="scroll-mt-20 space-y-4">
      <SectionTitle
        icon={Lightbulb}
        title="Fill your knowledge gaps"
        hint="Topics you scored under 60% on, plus adaptive suggestions."
      />
      {weakTopics.length === 0 && recs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500 font-medium">
          No weak topics detected yet. Take a skill assessment and this panel will
          point you at exactly what to revise.
        </div>
      ) : (
        <>
          {weakTopics.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              {weakTopics.slice(0, 6).map((t) => (
                <div
                  key={t.topic}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b border-slate-100 last:border-0 last:pb-0 first:pt-0"
                >
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${
                      t.percent >= 40
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}
                  >
                    {t.topic}
                  </span>
                  <p className="text-xs text-slate-500 font-semibold flex-1">
                    {t.correct}/{t.total} correct · {t.percent}%
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/learning-hub/my-learning"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-indigo-200 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      Review lesson
                    </Link>
                    <Link
                      href="/learning-hub/paths"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      Practice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recs.length > 0 && (
            <div className={`grid grid-cols-1 gap-4 ${narrow ? "" : "sm:grid-cols-3"}`}>
              {recs.map((rec, i) => (
                <div
                  key={`${rec.type}-${i}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-2"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">
                    {recTitle(rec.type)}
                  </span>
                  <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">{rec.description}</p>
                  <Link
                    href={recHref(rec)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    {recActionLabel(rec.type)}
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WeeklyGoalCard({ weekly, streak, plan }) {
  const thisWeek = weekly[weekly.length - 1] || { lessons: 0, minutes: 0, assessments: 0 };
  const targetMinutes = plan?.weeklyHours ? plan.weeklyHours * 60 : 0;
  const goalPct =
    targetMinutes && thisWeek.minutes
      ? Math.min(100, Math.round((thisWeek.minutes / targetMinutes) * 100))
      : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-black text-slate-800 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
          This week
        </p>
        <span
          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
            streak > 0
              ? "bg-amber-50 text-amber-600 border-amber-100"
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}
        >
          {streak > 0 ? `${streak}-week streak` : "No streak"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MiniStat label="Lessons" value={thisWeek.lessons} />
        <MiniStat label="Assessments" value={thisWeek.assessments} />
        <MiniStat label="Minutes" value={thisWeek.minutes} />
      </div>
      {goalPct != null ? (
        <>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Goal · {plan.weeklyHours} h/week
            </span>
            <span className="text-xs font-black text-indigo-600">{goalPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${goalPct >= 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
              style={{ width: `${Math.max(goalPct, 2)}%` }}
            />
          </div>
        </>
      ) : (
        <p className="text-[11px] text-slate-400 font-semibold">
          Study time tracked per lesson — set a weekly plan to unlock the goal bar.
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 py-2.5 text-center">
      <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function EmptyAccount() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center mx-auto max-w-2xl animate-fade-up">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
        <GraduationCap className="w-8 h-8 text-indigo-600" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3">Your learning journey starts here</h2>
      <p className="text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">
        Generate a personalized plan, enroll in a path, then take skill assessments to measure
        your progress. Everything you do shows up on this dashboard.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link
          href="/learning-hub/create-plan"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Create My Learning Plan
        </Link>
        <Link
          href="/learning-hub/paths"
          className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all"
        >
          Browse learning paths
        </Link>
      </div>
    </div>
  );
}

// ── Utility bits ──────────────────────────────────────────────────────────────

const REC_META = {
  "next-lesson": { chip: "Next step", href: "/learning-hub/my-learning", action: "Open my learning" },
  practice: { chip: "Practice", href: "#gaps", action: "See gaps" },
  path: { chip: "Pathways", href: "/learning-hub/paths", action: "Browse paths" },
  "job-gap": { chip: "Career", href: "/learning-hub/paths", action: "Explore paths" },
};

function recTitle(type) {
  return REC_META[type]?.chip || "Suggestion";
}

function recHref(rec) {
  return REC_META[rec.type]?.href || "/learning-hub/my-learning";
}

function recActionLabel(type) {
  return REC_META[type]?.action || "Open";
}
