"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import PageWrapper from "../../components/common/PageWrapper";
import { InlineSkeleton } from "../../components/learning/Skeletons";
import { useRequireLogin } from "../../lib/requireLogin";
import {
  fetchLesson,
  fetchMyPlans,
  updateLessonProgress,
  apiErrorMessage,
} from "../../lib/learningApi";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Lock,
  Target,
} from "lucide-react";

// useSearchParams needs a Suspense boundary or Next.js cannot prerender this route.
export default function LessonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 mx-auto max-w-3xl w-full px-4 pt-24">
            <div className="h-10 w-2/3 rounded-xl bg-slate-100 animate-pulse mb-6" />
            <div className="h-48 rounded-3xl bg-slate-100 animate-pulse" />
          </main>
        </div>
      }
    >
      <LessonContent />
    </Suspense>
  );
}

function LessonContent() {
  const router = useRouter();
  const requireLogin = useRequireLogin();
  const searchParams = useSearchParams();
  const lessonId = searchParams?.get("lesson") || "";
  const planId = searchParams?.get("plan") || "";

  const [lesson, setLesson] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const startedAt = useRef(Date.now());

  // The lesson player is for signed-in learners only — the login wall keeps
  // the return URL, so sign-in drops the user straight back onto this lesson.
  useEffect(() => {
    requireLogin();
  }, [requireLogin]);

  useEffect(() => {
    let cancelled = false;
    // In-page navigation (mark complete → next lesson) keeps this component
    // mounted — clear the "Saving…" flag so the next lesson's button is live.
    setCompleting(false);
    setError("");
    startedAt.current = Date.now();
    // First view loads the whole page; every later change keeps the shell
    // (header, tracker) mounted and only swaps the lesson body — no blink.
    if (lesson) setSwapping(true);
    (async () => {
      if (!lessonId) {
        if (!cancelled) setError("No lesson selected.");
        setLoading(false);
        return;
      }
      try {
        const [lessonData, plans] = await Promise.all([
          fetchLesson(lessonId, { auth: true }),
          fetchMyPlans(),
        ]);
        if (!cancelled) {
          setLesson(lessonData);
          setPlan(plans.find((p) => String(p._id) === String(planId)) || null);
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load lesson."));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSwapping(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, planId]);

  // Plan order flattened: prev/next nav + "next incomplete" resume target.
  const flatLessons = useMemo(() => {
    if (!plan?.modules) return [];
    return plan.modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, moduleTitle: m.title })));
  }, [plan]);
  const currentIndex = flatLessons.findIndex((l) => String(l.lessonId) === String(lessonId));
  const completedSet = new Set((plan?.completedLessonIds || []).map(String));
  const isCompleted = completedSet.has(String(lessonId));
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 ? flatLessons[currentIndex + 1] || null : null;
  const nextIncomplete =
    currentIndex >= 0 ? flatLessons.slice(currentIndex + 1).find((l) => !completedSet.has(String(l.lessonId))) || null : null;

  const lessonHref = (l) =>
    `/learning-hub/lesson?lesson=${encodeURIComponent(l.lessonId)}${planId ? `&plan=${encodeURIComponent(planId)}` : ""}`;

  const goToLesson = (l) => {
    startedAt.current = Date.now();
    router.push(lessonHref(l));
  };

  const handleComplete = async () => {
    if (completing || !lessonId) return;
    setCompleting(true);
    setError("");
    try {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
      await updateLessonProgress(lessonId, true, minutes, planId || null);
      // Optimistic: paint the completion into the plan immediately so the
      // tracker check + percent never blink while the refetch confirms it.
      const done = (plan?.progress?.completedLessons || 0) + 1;
      const total = plan?.progress?.totalLessons || flatLessons.length || 1;
      setPlan(
        (p) =>
          p && {
            ...p,
            completedLessonIds: [...(p.completedLessonIds || []), lessonId],
            progress: {
              ...p.progress,
              completedLessons: done,
              percent: Math.min(100, Math.round((done / total) * 100)),
            },
          },
      );
      const target = nextIncomplete || nextLesson;
      if (target) goToLesson(target);
      else router.push("/learning-hub/my-learning");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save your progress."));
      setCompleting(false);
    }
  };

  if (loading && !lesson) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <PageWrapper>
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-24 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-3">Loading lesson…</h1>
              <p className="text-slate-500 leading-relaxed">
                Opening the exact spot you left off in your plan.
              </p>
            </div>
          </PageWrapper>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <PageWrapper>
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-24 pb-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-7 h-7 text-indigo-600" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">Error</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">{error}</p>
              <Link
                href="/learning-hub/my-learning"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Back to My Learning
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </PageWrapper>
        </main>
        <Footer />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <PageWrapper>
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-24 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-indigo-600" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">Lesson not found</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">
                The lesson could not be loaded. It may have been unpublished or the link is incorrect.
              </p>
              <Link
                href="/learning-hub/my-learning"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Back to My Learning
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </PageWrapper>
        </main>
        <Footer />
      </div>
    );
  }

  // Plan structure provides the instant title, so the header changes the
  // moment navigation starts — before the lesson body fetch resolves.
  const currentRef = flatLessons[currentIndex] || {};
  const lessonTitle = currentRef.title || lesson.title || "Untitled";
  const durationRef = currentRef.durationMinutes ?? lesson.durationMinutes;
  const duration = durationRef ? `${durationRef} min` : "Self-paced";
  const progressPercent = plan?.progress?.percent ?? 0;
  const inPlan = currentIndex >= 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageWrapper>
          <section className="relative overflow-hidden">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-6">
              <div className="animate-fade-up">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5">
                  <Target className="w-3.5 h-3.5" aria-hidden="true" />
                  Lesson
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3 max-w-4xl">
                  {lessonTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
                  {plan && (
                    <span className="inline-flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                      {plan.title}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                    {duration}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                      isCompleted ? "text-indigo-600" : "text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {isCompleted ? "Completed" : "In progress"}
                  </span>
                </div>

                {plan && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500">Plan progress</span>
                      <span className="text-xs font-black text-indigo-600">{progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24">
            {/* Mobile course-tracker strip */}
            {inPlan && (
              <details className="lg:hidden mb-6 bg-white border border-slate-100 rounded-3xl premium-shadow">
                <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none list-none hover:bg-indigo-50 active:scale-[0.99] transition-all [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 text-sm font-black text-slate-900 text-left">Course content</span>
                  <span className="shrink-0 text-xs font-black text-indigo-600">
                    Lesson {currentIndex + 1} of {flatLessons.length}
                  </span>
                  <span className="flex-1 inline-flex items-center justify-end gap-1 text-xs font-black text-indigo-600">
                    {progressPercent}%
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  </span>
                </summary>
                <div className="px-2 pb-4">
                  <LessonTrackerRows
                    flatLessons={flatLessons}
                    currentIndex={currentIndex}
                    completedSet={completedSet}
                    onSelect={goToLesson}
                  />
                </div>
              </details>
            )}

            <div className={inPlan ? "grid lg:grid-cols-[320px_minmax(0,1fr)] gap-8 items-start" : ""}>
              {/* Sticky course tracker — where you are, what's left */}
              {inPlan && (
                <aside className="hidden lg:block self-start sticky top-24">
                  <div className="bg-white border border-slate-100 rounded-3xl premium-shadow p-4">
                    <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3">
                      <h2 className="text-sm font-black text-slate-900">Course content</h2>
                      <span className="text-[11px] font-black text-indigo-600 whitespace-nowrap">
                        Lesson {currentIndex + 1} of {flatLessons.length}
                      </span>
                    </div>
                    <LessonTrackerRows
                      flatLessons={flatLessons}
                      currentIndex={currentIndex}
                      completedSet={completedSet}
                      onSelect={goToLesson}
                    />
                  </div>
                </aside>
              )}

              <div className={inPlan ? "min-w-0" : "max-w-3xl mx-auto"}>
                <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 premium-shadow">
                  {error && (
                    <p
                      role="alert"
                      className="mb-6 rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm font-semibold text-indigo-600 flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {error}
                    </p>
                  )}

                  {swapping ? (
                    <InlineSkeleton rows={8} />
                  ) : (
                    <>
              {lesson.content?.introduction && (
                <div className="mb-6">
                  <h2 className="text-lg font-black text-slate-900 mb-3">Introduction</h2>
                  <p className="text-slate-600 leading-relaxed">{lesson.content.introduction}</p>
                </div>
              )}

              {Array.isArray(lesson.objectives) && lesson.objectives.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-black text-slate-900 mb-3">What you&apos;ll learn</h2>
                  <ul className="space-y-2">
                    {lesson.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.content?.explanation && (
                <div className="mb-6">
                  <h2 className="text-lg font-black text-slate-900 mb-3">Lesson</h2>
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: lesson.content.explanation }}
                  />
                </div>
              )}

              {lesson.content?.summary && (
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-900 mb-3">Summary</h2>
                  <p className="text-slate-600 leading-relaxed">{lesson.content.summary}</p>
                </div>
              )}

              {!lesson.content?.introduction &&
                !lesson.content?.explanation &&
                !lesson.content?.summary && (
                  <p className="text-slate-500">
                    This lesson has no content yet. Check back soon.
                  </p>
                )}
                    </>
                  )}

              {/* Footer nav — resume engine */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-3">
                {prevLesson ? (
                  <button
                    type="button"
                    onClick={() => goToLesson(prevLesson)}
                    disabled={swapping}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm hover:bg-slate-100 hover:border-indigo-200 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Previous
                  </button>
                ) : null}

                {inPlan && !isCompleted ? (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={completing || swapping}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 sm:ml-auto"
                  >
                    {completing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Saving…
                      </>
                    ) : (
                      <>
                        Mark complete &amp; continue
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                ) : null}

                {inPlan && isCompleted ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = nextIncomplete || nextLesson;
                      if (target) goToLesson(target);
                      else router.push("/learning-hub/my-learning");
                    }}
                    disabled={swapping}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 sm:ml-auto"
                  >
                    Continue to next lesson
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : null}

                {nextLesson && !isCompleted ? (
                  <button
                    type="button"
                    onClick={() => goToLesson(nextLesson)}
                    disabled={swapping}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm hover:bg-slate-100 hover:border-indigo-200 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : null}

                {!inPlan ? (
                  <Link
                    href="/learning-hub/my-learning"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 active:scale-95 transition-all sm:ml-auto"
                  >
                    Back to My Learning
                  </Link>
                ) : null}
              </div>

              {inPlan && (
                <p className="mt-3 text-xs text-slate-400">
                  Lesson {currentIndex + 1} of {flatLessons.length} in this plan · your progress saves
                  automatically when you mark a lesson complete.
                </p>
              )}
                </div>
              </div>
            </div>
          </section>
        </PageWrapper>
      </main>
      <Footer />
    </div>
  );
}

// Left course tracker — where the learner is, what's done, what's still locked.
// Completed lessons are the only clickable rows; forward motion goes through
// "Mark complete & continue" so tracking stays linear (w3schools-style).
function LessonTrackerRows({ flatLessons, currentIndex, completedSet, onSelect }) {
  const groups = [];
  flatLessons.forEach((l, i) => {
    const last = groups[groups.length - 1];
    if (last && last.title === (l.moduleTitle || "Lessons")) last.lessons.push({ l, i });
    else groups.push({ title: l.moduleTitle || "Lessons", lessons: [{ l, i }] });
  });

  return (
    <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
      {groups.map((group, gi) => (
        <div key={`g-${gi}`} className="mb-3 last:mb-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-1.5">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.lessons.map(({ l, i }) => {
              const label = l.title || `Lesson ${i + 1}`;
              const id = String(l.lessonId);
              if (i === currentIndex) {
                return (
                  <div
                    key={`${i}-${id}`}
                    aria-current="step"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-600"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                    <span className="ml-auto text-[10px] font-black uppercase tracking-wider shrink-0">
                      Now
                    </span>
                  </div>
                );
              }
              if (completedSet.has(id)) {
                return (
                  <button
                    key={`${i}-${id}`}
                    type="button"
                    onClick={() => onSelect(l)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 text-left hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              }
              return (
                <div
                  key={`${i}-${id}`}
                  title="Locked — complete the previous lessons to unlock"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
