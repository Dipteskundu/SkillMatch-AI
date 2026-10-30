"use client";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clock, Compass, Flag, LesserErrors, Loader2, MagicWand, Pencil, Save, Sparkles, Target, Timer, TrendingUp, X } from "lucide-react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import PageWrapper from "../../components/common/PageWrapper";
import { InlineSkeleton } from "../../components/learning/Skeletons";
import { useRequireLogin } from "../../lib/requireLogin";
import {
  fetchLesson,
  askLessonQuestion,
  submitLessonKnowledgeCheck,
  updateLessonProgress,
  apiErrorMessage,
} from "../../lib/learningApi";

export default function LessonPage() {
  const router = useRouter();
  const lessonId = "html-document-structure";
  const planId = "default";

  const requireLogin = useRequireLogin();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    ;(async () => {
      try {
        setLoading(true);
        const fetched = await fetchLesson(lessonId, { auth: true });
        if (!cancelled) setLesson(fetched);
      } catch (err) {
        if (!cancelled) {
          setError("Could not load lesson.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  if (loading) {
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
                Sequencing modules around your skills and schedule. Usually under a minute.
              </p>
            </div>
          </PageWrapper>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <PageWrapper>
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-24 pb-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-7 h-7 text-rose-600" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">Error</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">{error}</p>
              <Link
                href="/learning-hub/my-learning"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 transition-all"
              >
                Return to My Learning
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
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-rose-600" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">Lesson not found</h1>
              <p className="text-slate-500 leading-relaxed">
                The lesson could not be loaded. It may have been unpublished or the link
                is incorrect.
              </p>
              <Link
                href="/learning-hub/my-learning"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 transition-all"
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

  // Minimal lesson display
  const isDark = document.documentElement.classList.contains("dark");
  const lessonTitle = lesson.title || "Untitled";
  const duration = lesson.durationMinutes
    ? `${Math.floor(lesson.durationMinutes / 60)}h ${lesson.durationMinutes % 60}m`
    : "Self-paced";
  const progressPercent = lesson.progress?.percent || 0;
  const themeClass = isDark ? "text-slate-300" : "text-slate-400";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageWrapper>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient" aria-hidden="true" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10">
              <div className="animate-fade-up max-w-2xl">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5">
                  <Target className="w-3.5 h-3.5" aria-hidden="true" />
                  Lesson
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                  {lessonTitle}
                  {lesson.level && (
                    <span className="text-indigo-600 capitalize">{lesson.level}</span>
                  )}
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed mb-8">
                  {lesson.topic || "Skill development"}
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 premium-shadow card-hover">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
                    {lesson.progress?.completed ? "Completed" : "In Progress"}
                  </p>
                  <p className="text-sm text-slate-500">Module: {lesson.moduleTitle || ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600">{duration}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className={themeClass}>{progressPercent}%</span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {lesson.content?.introduction && (
                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-900 mb-3">Introduction</h3>
                  <p className="text-slate-500 leading-relaxed">{lesson.content.introduction}</p>
                </div>
              )}

              {lesson.objectives?.length && (
                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-900 mb-3">What You'll Learn</h3>
                  <ul className="space-y-2 text-slate-600">
                    {lesson.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-600 flex-shrink-0">{i + 1}. </span>
                        <span className="line-clamp-2">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.content?.explanation && (
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-3">Explanation</h3>
                  <div
                    className="prose prose-invert dark:prose-invert dark"
                    dangerouslySetInnerHTML={{ __html: lesson.content.explanation }}
                  />
                </div>
              )}

              {lesson.content?.summary && (
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-3">Summary</h3>
                  <p className="text-slate-500">{lesson.content.summary}</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href="/learning-hub/my-learning"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm"
                >
                  Back to My Learning
                </Link>
              </div>
            </div>
          </section>
        </PageWrapper>
      </main>
      <Footer />
    </div>
  );
}