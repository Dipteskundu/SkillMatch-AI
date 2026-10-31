"use client";

/**
 * Stat detail pages for the My Assessments dashboard.
 * One dynamic route, four metrics:
 *   /learning-hub/assessments/stats/attempts  → full attempt history + filters
 *   /learning-hub/assessments/stats/average   → hero % + score trend + breakdowns
 *   /learning-hub/assessments/stats/best      → hero % + top attempts + per-skill best
 *   /learning-hub/assessments/stats/courses   → all non-completed courses
 *
 * Data comes from the same endpoints as the overview (fetched fresh here);
 * no server changes, no state passed between pages.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PrivateGate, SectionTitle, CourseCard, HeroStat, AttemptHistoryTable, truncate, typeLabel } from "../../components/OverviewPieces";
import { LearningScoreTrendChart } from "../../../../dashboard/components/DashboardCharts";
import {
  fetchMyPlansWithActivity,
  fetchAssessmentSummary,
} from "../../../../lib/learningApi";
import { averageBy, topAttempts } from "../../../../lib/learningAnalytics";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Trophy,
  Award,
  BookOpen,
  CheckCircle2,
  Target,
  AlertTriangle,
  BarChart2,
} from "lucide-react";

const VALID_METRICS = new Set(["attempts", "average", "best", "courses"]);

export default function StatDetailPage() {
  return (
    <PrivateGate>
      <StatDetailContent />
    </PrivateGate>
  );
}

function StatDetailContent() {
  const { metric } = useParams();
  const [plans, setPlans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const valid = VALID_METRICS.has(metric);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    (async () => {
      const [plansRes, summaryRes] = await Promise.allSettled([
        fetchMyPlansWithActivity(),
        fetchAssessmentSummary(),
      ]);
      if (cancelled) return;
      let fatal = true;
      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value.plans);
        fatal = false;
      }
      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value);
        fatal = false;
      }
      if (fatal) setError("Could not load your learning data. Please try again later.");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [valid]);

  if (!valid) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl bg-white border border-red-100 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm font-bold text-slate-900 mb-1">Unknown stat</p>
        <p className="text-sm text-slate-500 font-medium mb-5">
          &quot;{metric}&quot; is not a tracked metric.
        </p>
        <Link
          href="/learning-hub/assessments"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to My Assessments
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4" aria-busy="true">
        <div className="h-8 w-52 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl bg-white border border-red-100 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm font-bold text-slate-900 mb-5">{error}</p>
        <Link
          href="/learning-hub/assessments"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to My Assessments
        </Link>
      </div>
    );
  }

  const attempts = summary?.attempts || [];
  const scored = attempts.filter((a) => typeof a.score === "number");
  const inProgress = plans.filter(
    (p) => p.status !== "draft" && (p.progress?.percent ?? 0) > 0 && (p.progress?.percent ?? 0) < 100,
  );
  const drafts = plans.filter((p) => p.status === "draft");
  const notStarted = plans.filter(
    (p) => p.status !== "draft" && (p.progress?.percent ?? 0) === 0,
  );
  const nonCompleted = [...inProgress, ...drafts, ...notStarted];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <div>
        <Link
          href="/learning-hub/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to My Assessments
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <PageIcon metric={metric} />
          {PAGE_META[metric].title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{PAGE_META[metric].subtitle}</p>
      </div>

      {metric === "attempts" && <AttemptsDetail attempts={attempts} />}
      {metric === "average" && <AverageDetail summary={summary} scored={scored} />}
      {metric === "best" && <BestDetail summary={summary} scored={scored} />}
      {metric === "courses" && (
        <CoursesDetail plans={plans} nonCompleted={nonCompleted} />
      )}
    </div>
  );
}

const PAGE_META = {
  attempts: {
    title: "Total attempts",
    subtitle: "Every skill assessment you have tracked — completed and in progress.",
  },
  average: {
    title: "Average score",
    subtitle: "How your scores trend over time and where the average comes from.",
  },
  best: {
    title: "Best score",
    subtitle: "Your strongest performances, ranked.",
  },
  courses: {
    title: "Courses in progress",
    subtitle: "Everything not yet at 100% — resume where you left off.",
  },
};

function PageIcon({ metric }) {
  const cls = "w-7 h-7 text-indigo-600";
  if (metric === "attempts") return <ClipboardCheck className={cls} aria-hidden="true" />;
  if (metric === "average") return <Trophy className={cls} aria-hidden="true" />;
  if (metric === "best") return <Award className={cls} aria-hidden="true" />;
  return <BookOpen className={cls} aria-hidden="true" />;
}

// ── Attempts ──────────────────────────────────────────────────────────────────

function AttemptsDetail({ attempts }) {
  const [filter, setFilter] = useState("all");
  const types = useMemo(
    () => [...new Set(attempts.map((a) => a.type).filter(Boolean))],
    [attempts],
  );
  const filtered = filter === "all" ? attempts : attempts.filter((a) => a.type === filter);
  const completedCount = attempts.filter((a) => typeof a.score === "number").length;

  if (attempts.length === 0) {
    return <EmptyMetric icon={ClipboardCheck} title="No attempts yet" text="Take your first skill assessment — module, diagnostic, or standalone." cta={{ href: "/learning-hub/paths", label: "Browse paths" }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All ({attempts.length})
        </FilterChip>
        {types.map((t) => (
          <FilterChip key={t} active={filter === t} onClick={() => setFilter(t)}>
            {typeLabel(t)} ({attempts.filter((a) => a.type === t).length})
          </FilterChip>
        ))}
        <span className="ml-auto text-xs font-bold text-slate-400">
          {completedCount} completed · {attempts.length - completedCount} in progress
        </span>
      </div>
      <AttemptHistoryTable attempts={filtered} />
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
      }`}
    >
      {children}
    </button>
  );
}

// ── Average ───────────────────────────────────────────────────────────────────

function AverageDetail({ summary, scored }) {
  if (scored.length === 0) {
    return <EmptyMetric icon={Trophy} title="No scores yet" text="Complete an assessment and your average score will appear here." cta={{ href: "/learning-hub/paths", label: "Browse paths" }} />;
  }

  const byType = averageBy(scored, "type");
  const bySkill = averageBy(scored, "skill");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HeroStat value={summary?.averageScore ?? 0} suffix="%" label="Average across all attempts" tone="emerald" />
        <div className="lg:col-span-2">
          <LearningScoreTrendChart attempts={scored} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard
          icon={BarChart2}
          title="Average by assessment type"
          rows={byType.map((g) => ({ ...g, label: typeLabel(g.key) }))}
        />
        <BreakdownCard
          icon={BookOpen}
          title="Average by skill"
          rows={bySkill}
        />
      </div>
    </div>
  );
}

// ── Best ──────────────────────────────────────────────────────────────────────

function BestDetail({ summary, scored }) {
  if (scored.length === 0) {
    return <EmptyMetric icon={Award} title="No scores yet" text="Complete an assessment and your best performances will show up here." cta={{ href: "/learning-hub/paths", label: "Browse paths" }} />;
  }

  const top = topAttempts(scored, 5);
  const bySkill = averageBy(scored, "skill"); // sorted best-first — first row per skill is its best

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HeroStat value={summary?.bestScore ?? 0} suffix="%" label="Personal best" tone="amber" />
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
            Top 5 attempts
          </p>
          <ol className="space-y-2.5">
            {top.map((a, i) => (
              <li key={a.attemptId} className="flex items-center gap-3">
                <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-black ${
                  i === 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{a.skill || "Assessment"}</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {typeLabel(a.type)} · {new Date(a.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className="text-sm font-black text-emerald-600">{a.score}%</span>
                <Link
                  href={`/learning-hub/assessments/results/${a.attemptId}`}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  View
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <BreakdownCard
        icon={Target}
        title="Your best per skill"
        rows={bySkill}
      />
    </div>
  );
}

// ── Courses ───────────────────────────────────────────────────────────────────

function CoursesDetail({ plans, nonCompleted }) {
  const completed = plans.filter((p) => (p.progress?.percent ?? 0) === 100);

  if (plans.length === 0) {
    return <EmptyMetric icon={BookOpen} title="No courses yet" text="Create a personalized plan or enroll in a path to start learning." cta={{ href: "/learning-hub/create-plan", label: "Create My Learning Plan" }} />;
  }

  return (
    <div className="space-y-6">
      {nonCompleted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm font-bold text-emerald-600 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          All your courses are complete. Outstanding work!
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {nonCompleted.map((plan) => (
            <CourseCard key={plan._id} plan={plan} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <section className="space-y-3">
          <SectionTitle
            icon={CheckCircle2}
            title={`Also completed (${completed.length})`}
            hint="These sit at 100% — review them anytime."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completed.map((plan) => (
              <div key={plan._id} className="bg-white rounded-2xl border border-emerald-100 p-4 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-800 truncate min-w-0" title={truncate(plan.title, 60)}>
                  {truncate(plan.title, 40)}
                </p>
                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-black">
                  100%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Shared detail bits ────────────────────────────────────────────────────────

function BreakdownCard({ icon: Icon, title, rows }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
        {title}
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-600 truncate">
                {row.label || row.key}
                <span className="text-slate-400 font-semibold ml-1.5">({row.count})</span>
              </span>
              <span className={`text-xs font-black ${row.average >= 60 ? "text-emerald-600" : row.average >= 40 ? "text-amber-500" : "text-red-500"}`}>
                {row.average}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${row.average >= 60 ? "bg-emerald-500" : row.average >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                style={{ width: `${Math.max(row.average, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyMetric({ icon: Icon, title, text, cta }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center mx-auto max-w-xl">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
        <Icon className="w-8 h-8 text-indigo-600" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-black text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">{text}</p>
      <Link
        href={cta.href}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
      >
        {cta.label}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
