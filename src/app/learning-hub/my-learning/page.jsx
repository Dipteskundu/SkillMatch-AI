"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import PageWrapper from "../../components/common/PageWrapper";
import { InlineSkeleton } from "../../components/learning/Skeletons";
import {
  fetchMyPlans,
  updatePlan,
  formatDuration,
  apiErrorMessage,
} from "../../lib/learningApi";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Layers,
  Pencil,
  Save,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";

// useSearchParams needs a Suspense boundary or Next.js cannot prerender this route.
export default function MyLearningPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-24 pb-24">
            <div className="h-8 w-40 rounded-xl bg-slate-100 animate-pulse mb-8" />
            <div className="h-12 w-2/3 rounded-xl bg-slate-100 animate-pulse mb-4" />
            <div className="h-5 w-1/2 rounded-xl bg-slate-100 animate-pulse mb-10" />
            <InlineSkeleton rows={5} />
          </main>
        </div>
      }
    >
      <MyLearningContent />
    </Suspense>
  );
}

function MyLearningContent() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingId, setSavingId] = useState(null);

  const enrolledId = searchParams?.get("enrolled");
  const savedId = searchParams?.get("saved");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMyPlans();
        if (cancelled) return;
        setPlans(data);
        if (enrolledId || savedId) {
          setNotice(
            enrolledId
              ? "Path enrolled. Your plan is ready below."
              : "Plan saved. It's live below.",
          );
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load your plans."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enrolledId, savedId]);

  const startRename = (plan) => {
    setEditingId(plan._id);
    setEditTitle(plan.title);
  };

  const saveRename = async (plan) => {
    const title = editTitle.trim();
    if (!title || title === plan.title) {
      setEditingId(null);
      return;
    }
    setSavingId(plan._id);
    try {
      const updated = await updatePlan(plan._id, { title });
      setPlans((prev) => prev.map((p) => (p._id === plan._id ? { ...p, title: updated.title } : p)));
      setEditingId(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not rename this plan."));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <PageWrapper>
          {/* ── Header ── */}
          <section className="relative overflow-hidden">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10">
              <div className="animate-fade-up max-w-3xl">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  My learning
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                  Your plans,
                  <span className="text-indigo-600"> in one place.</span>
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
                  Enrolled paths and AI-generated roadmaps live here. Progress starts
                  filling in as you complete lessons.
                </p>
              </div>
            </div>
          </section>

          {/* ── Content ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
            {notice && (
              <div
                role="status"
                className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 mb-6 flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-700">{notice}</p>
                <button
                  type="button"
                  onClick={() => setNotice("")}
                  className="ml-auto text-slate-400 hover:text-slate-600"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 mb-6 text-sm font-semibold text-indigo-600 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            {!loading && plans.length > 0 && <AchievementsStrip plans={plans} />}

            {loading ? (
              <InlineSkeleton rows={5} />
            ) : plans.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan._id}
                    plan={plan}
                    editing={editingId === plan._id}
                    editTitle={editTitle}
                    saving={savingId === plan._id}
                    onEditTitle={setEditTitle}
                    onStartRename={() => startRename(plan)}
                    onCancelRename={() => setEditingId(null)}
                    onSaveRename={() => saveRename(plan)}
                  />
                ))}
              </div>
            )}
          </section>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}

function PlanCard({
  plan,
  editing,
  editTitle,
  saving,
  onEditTitle,
  onStartRename,
  onCancelRename,
  onSaveRename,
}) {
  const isDraft = plan.status === "draft";
  const isEnrolled = plan.source === "enrollment";
  const diagnostic = plan.diagnostic;
  const progress = plan.progress || { percent: 0, completedLessons: 0, totalLessons: 0 };

  // Resume target: the first lesson in plan order not yet completed. Falls
  // back to the plan/path page from the old behavior for drafts & finished plans.
  const completedSet = new Set((plan.completedLessonIds || []).map(String));
  const nextLesson = (plan.modules || [])
    .flatMap((m) => m.lessons || [])
    .find((l) => !completedSet.has(String(l.lessonId)));
  const continueHref = !isDraft && nextLesson
    ? `/learning-hub/lesson?lesson=${encodeURIComponent(nextLesson.lessonId)}&plan=${plan._id}`
    : isEnrolled && plan.sourcePathSlug
      ? `/learning-hub/paths/${plan.sourcePathSlug}`
      : "/learning-hub/paths";

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 premium-shadow card-hover flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4">
        {editing ? (
          <div className="flex-1">
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => onEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveRename();
                if (e.key === "Escape") onCancelRename();
              }}
              className="w-full text-lg font-black text-slate-900 border-b-2 border-indigo-300 focus:outline-none pb-1"
            />
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={onSaveRename}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : <><Save className="w-3 h-3" aria-hidden="true" /> Save</>}
              </button>
              <button
                type="button"
                onClick={onCancelRename}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-slate-900 mb-2 break-words">{plan.title}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border bg-indigo-50 text-indigo-600 border-indigo-100"
              >
                {isDraft ? "Draft" : "Active"}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100 text-[11px] font-bold uppercase tracking-wider">
                {isEnrolled ? "Path" : "AI plan"}
              </span>
              {plan.startingLevel && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[11px] font-bold uppercase tracking-wider capitalize">
                  {plan.startingLevel}
                </span>
              )}
              {diagnostic?.status === "completed" && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[11px] font-bold uppercase tracking-wider">
                  Baseline {diagnostic.score}%
                </span>
              )}
            </div>
          </div>
        )}

        {!editing && (
          <button
            type="button"
            onClick={onStartRename}
            className="shrink-0 w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
            aria-label={`Rename ${plan.title}`}
            title="Rename"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">Progress</span>
          <span className="text-xs font-black text-indigo-600">{progress.percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          {progress.completedLessons} of {progress.totalLessons} lessons completed
        </p>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5 pb-5 border-b border-slate-100">
        <Meta icon={Layers} label={`${plan.moduleCount} modules`} />
        <Meta icon={BookOpen} label={`${plan.lessonCount} lessons`} />
        {plan.weeklyHours ? (
          <Meta icon={Timer} label={`${plan.weeklyHours} h/week`} />
        ) : (
          <Meta icon={Compass} label={formatDuration(plan)} />
        )}
        {plan.estimatedWeeks && <Meta icon={TrendingUp} label={`${plan.estimatedWeeks} weeks`} />}
      </div>

      {plan.expectedOutcomes?.length > 0 && (
        <ul className="space-y-1.5 mb-5">
          {plan.expectedOutcomes.slice(0, 3).map((outcome) => (
            <li key={outcome} className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="line-clamp-2">{outcome}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-3">
        <Link
          href={continueHref}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          {isDraft ? "Review plan" : nextLesson ? "Continue" : "Review plan"}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
        {isDraft && (
          <Link
            href="/learning-hub/create-plan"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xs premium-shadow hover:bg-slate-50 hover:border-indigo-200 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            Edit answers
          </Link>
        )}
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      <Icon className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
      {label}
    </span>
  );
}

function AchievementsStrip({ plans }) {
  const active = plans.filter((p) => p.status === "active").length;
  const lessonsDone = plans.reduce((n, p) => n + (p.progress?.completedLessons || 0), 0);
  const lessonsTotal = plans.reduce((n, p) => n + (p.progress?.totalLessons || 0), 0);
  const percent = lessonsTotal ? Math.min(100, Math.round((lessonsDone / lessonsTotal) * 100)) : 0;
  const baseline = plans.find((p) => p.diagnostic?.status === "completed")?.diagnostic?.score;

  const tiles = [
    { icon: Target, label: "Active plans", value: active },
    { icon: BookOpen, label: "Lessons completed", value: lessonsDone },
    { icon: TrendingUp, label: "Overall progress", value: `${percent}%` },
  ];
  if (baseline !== undefined) {
    tiles.push({ icon: CheckCircle2, label: "Baseline score", value: `${baseline}%` });
  }

  return (
    <section aria-label="Your achievements" className="mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5 premium-shadow"
          >
            <Icon className="w-4 h-4 text-indigo-600 mb-3" aria-hidden="true" />
            <p className="text-2xl font-black text-slate-900 leading-none mb-1.5">{value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl text-center bg-white border border-slate-100 rounded-3xl p-10 sm:p-14 premium-shadow">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
        <Target className="w-8 h-8 text-indigo-600" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3">No plans yet</h2>
      <p className="text-slate-500 leading-relaxed mb-8">
        Answer five questions and the Learning Hub builds a roadmap around your skills
        and schedule — or enrol directly in a published path.
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
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm premium-shadow hover:bg-slate-50 hover:border-indigo-200 active:scale-95 transition-all"
        >
          Browse paths
        </Link>
      </div>
    </div>
  );
}
