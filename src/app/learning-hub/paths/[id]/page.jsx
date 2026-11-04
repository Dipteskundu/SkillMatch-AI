"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar/Navbar";
import Footer from "../../../components/Footer/Footer";
import PageWrapper from "../../../components/common/PageWrapper";
import { InlineSkeleton } from "../../../components/learning/Skeletons";
import {
  fetchPath,
  formatDuration,
  enrollInPath,
  apiErrorMessage,
} from "../../../lib/learningApi";
import { useRequireLogin } from "../../../lib/requireLogin";
import { useAuth } from "../../../lib/AuthContext";
import { signInUrlWithReturn } from "../../../lib/redirect";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Layers,
  BookOpen,
  CheckCircle2,
  Lock,
  Loader2,
  Play,
  Sparkles,
  Target,
  ListChecks,
  AlertTriangle,
} from "lucide-react";

// Indigo-only accent across Learning Hub — level reads as text, not color.
const LEVEL_STYLES = "bg-indigo-50 text-indigo-600 border-indigo-100";

export default function PathDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const requireLogin = useRequireLogin();
  const { user, loading: authLoading } = useAuth();

  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    (async () => {
      try {
        const data = await fetchPath(id);
        if (!cancelled) setPath(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? "This learning path could not be found."
              : "Could not load this learning path right now.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // w3schools flow: Start → (login wall, once) → straight into lesson content.
  // Falls back to the first lesson; a returning user resumes at the next
  // incomplete one because the enroll response carries completedLessonIds.
  const enrollAndJump = async () => {
    if (enrolling || !id) return;
    setEnrollError("");
    setEnrolling(true);
    try {
      const plan = await enrollInPath(id);
      const completed = new Set((plan?.completedLessonIds || []).map(String));
      const flat = (plan?.modules || []).flatMap((m) => m.lessons || []);
      const target = flat.find((l) => !completed.has(String(l.lessonId))) || flat[0];
      if (target && plan?._id) {
        router.push(
          `/learning-hub/lesson?lesson=${encodeURIComponent(String(target.lessonId))}&plan=${encodeURIComponent(String(plan._id))}`,
        );
      } else {
        // Path has no published lessons yet — land on the plan list as before.
        router.push(`/learning-hub/my-learning?enrolled=${encodeURIComponent(plan?._id || "")}`);
      }
    } catch (err) {
      setEnrollError(
        apiErrorMessage(err, "Could not enroll in this path. Please try again."),
      );
      setEnrolling(false);
    }
  };

  const handleStart = () => {
    if (!id || enrolling) return;
    if (requireLogin()) {
      enrollAndJump();
      return;
    }
    // Guest: tag the URL so the post-sign-in return auto-launches the path.
    const url = new URL(window.location.href);
    if (!url.searchParams.has("start")) {
      url.searchParams.set("start", "1");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
    window.location.assign(signInUrlWithReturn(url.pathname + url.search));
  };

  // Auto-start: learner came back from the sign-in wall with ?start=1.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (authLoading || !user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("start") !== "1" || autoStartedRef.current) return;
    autoStartedRef.current = true;
    params.delete("start");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    enrollAndJump();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per sign-in return
  }, [user, authLoading]);

  const handleCreatePlan = () => {
    if (!requireLogin()) return;
    router.push("/learning-hub/create-plan");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-14 pb-24">
          <div className="h-8 w-40 rounded-xl bg-slate-100 animate-pulse mb-8" />
          <div className="h-12 w-2/3 rounded-xl bg-slate-100 animate-pulse mb-4" />
          <div className="h-5 w-1/2 rounded-xl bg-slate-100 animate-pulse mb-10" />
          <InlineSkeleton rows={6} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-24 pb-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-7 h-7 text-indigo-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">
              {error || "Learning path not found"}
            </h1>
            <p className="text-slate-500 mb-8">
              The path may have been unpublished, or the link is incorrect.
            </p>
            <Link
              href="/learning-hub/paths"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to all paths
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const levelClass = LEVEL_STYLES;

  const totalLessons = path.lessonCount ?? 0;
  const previewLessons = path.modules.reduce(
    (n, m) => n + (m.lessons || []).filter((l) => l.isPreview).length,
    0,
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <PageWrapper>
          {/* ── Hero ── */}
          <section className="relative overflow-hidden">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12">
              <Link
                href="/learning-hub/paths"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                All learning paths
              </Link>

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${levelClass}`}>
                  {path.level}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {path.category || path.topic}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-5 max-w-3xl leading-[1.08]">
                {path.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-3xl">
                {path.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  {path.moduleCount ?? path.modules.length} modules
                </span>
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  {totalLessons} lessons
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  {formatDuration(path)}
                </span>
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <Target className="w-4 h-4" aria-hidden="true" />
                  {path.estimatedHours} hours
                </span>
              </div>

              {/* CTA row */}
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={enrolling}
                  className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" aria-hidden="true" />
                      Start this path
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCreatePlan}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm premium-shadow hover:bg-slate-50 hover:border-indigo-200 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  Customize with AI instead
                </button>
              </div>
              {enrollError && (
                <p
                  role="alert"
                  className="mt-3 text-xs font-semibold text-indigo-600 inline-flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  {enrollError}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-400 inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3" aria-hidden="true" />
                Enrolling and full lessons require a free account.
              </p>
            </div>
          </section>

          {/* ── Objectives + Prerequisites ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 premium-shadow">
                <h2 className="flex items-center gap-2 font-bold text-slate-900 mb-5 text-lg">
                  <Target className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  What you&apos;ll achieve
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(path.objectives || []).map((obj) => (
                    <li
                      key={obj}
                      className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 premium-shadow">
                <h2 className="flex items-center gap-2 font-bold text-slate-900 mb-5 text-lg">
                  <ListChecks className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  Prerequisites
                </h2>
                {path.prerequisites?.length ? (
                  <ul className="space-y-2.5">
                    {path.prerequisites.map((prereq) => (
                      <li
                        key={prereq}
                        className="flex items-start gap-2.5 text-sm text-slate-600"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" aria-hidden="true" />
                        {prereq}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No prerequisites — this path starts from scratch.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── Curriculum ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Curriculum
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  {path.modules.length} modules · {totalLessons} lessons ·{" "}
                  {previewLessons} preview lesson{previewLessons === 1 ? "" : "s"} open below
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                <Play className="w-3 h-3" aria-hidden="true" />
                Previews unlocked
              </span>
            </div>

            <div className="space-y-5">
              {path.modules.map((mod, mi) => (
                <details
                  key={mod._id || mod.slug}
                  open={mi === 0}
                  className="group bg-white border border-slate-100 rounded-3xl overflow-hidden premium-shadow"
                >
                  <summary className="flex items-center gap-4 p-5 sm:p-6 cursor-pointer list-none select-none hover:bg-slate-50/60 transition-colors">
                    <span className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600 shrink-0">
                      {String(mi + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 truncate">{mod.title}</h3>
                      <p className="text-sm text-slate-500 truncate mt-0.5">{mod.description}</p>
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-slate-400 shrink-0">
                      {(mod.lessons || []).length} lessons · {mod.estimatedHours}h
                    </span>
                  </summary>

                  <div className="border-t border-slate-100">
                    {(mod.lessons || []).map((lesson) => (
                      <div
                        key={lesson._id || lesson.slug}
                        className="flex items-center gap-4 px-5 sm:px-6 py-4 border-b border-slate-50 last:border-b-0"
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            lesson.isPreview
                              ? "bg-indigo-50 border border-indigo-100 text-indigo-600"
                              : "bg-slate-50 border border-slate-100 text-slate-400"
                          }`}
                          aria-hidden="true"
                        >
                          {lesson.isPreview ? (
                            <Play className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {lesson.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {(lesson.topics || []).join(" · ")}
                          </p>
                        </div>

                        <span className="text-xs text-slate-400 shrink-0 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {lesson.durationMinutes}m
                        </span>

                        {lesson.isPreview ? (
                          <span className="text-[11px] font-bold text-indigo-600 shrink-0">
                            Preview
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 shrink-0">
                            Sign in
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {mod.completionCriteria && (
                    <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold">Completion criteria:</span>{" "}
                        {mod.completionCriteria}
                      </p>
                    </div>
                  )}
                </details>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-10 rounded-3xl bg-slate-900 p-7 sm:p-10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-indigo-600/30 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <h3 className="text-xl font-bold mb-1.5">Ready to start {path.title}?</h3>
                <p className="text-slate-400 text-sm max-w-lg">
                  Jump straight into the first lesson — your progress is saved
                  to your account.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                disabled={enrolling}
                className="relative inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
              >
                {enrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" aria-hidden="true" />
                    Starting…
                  </>
                ) : (
                  <>
                    Get started
                    <ArrowRight className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </section>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
