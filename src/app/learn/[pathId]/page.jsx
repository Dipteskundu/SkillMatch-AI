"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import {
  useGetLearningPathQuery,
  useGetLearningCatalogQuery,
  useEnrollLearningPathMutation,
  useReleaseLearningPathMutation,
} from "../../store/api/apiSlice";
import {
  flattenCatalog,
  flattenPathLessons,
  learnErrorMessage,
  learningErrorCode,
  nextIncompleteLesson,
  quizUnlockState,
  readLearningData,
} from "../../lib/learning";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import {
  LevelChip,
  ProgressBar,
  Skeleton,
  ErrorNotice,
  ComingSoon,
  SignInPrompt,
} from "../components/LearnBits";

/**
 * Path overview at /learn/[pathId] — module accordion, enroll-on-demand CTA,
 * free-limit "switch path" release flow, and the quiz gate card.
 */
export default function LearningPathPage() {
  const { pathId } = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const pathQuery = useGetLearningPathQuery(pathId);
  // Only needed for signed-in users — tells us which path to release when
  // the free active-path limit blocks enrolling here.
  const catalogQuery = useGetLearningCatalogQuery(undefined, { skip: !isAuthenticated });

  const [enroll, enrollState] = useEnrollLearningPathMutation();
  const [release, releaseState] = useReleaseLearningPathMutation();

  const [limitBlocked, setLimitBlocked] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [toggled, setToggled] = useState({});

  const payload = useMemo(() => readLearningData(pathQuery.data), [pathQuery.data]);
  const path = payload?.path && typeof payload.path === "object" ? payload.path : null;

  const loadFailed =
    pathQuery.isError || Boolean(pathQuery.data && pathQuery.data.success === false);
  const is404 = pathQuery.isError && pathQuery.error?.status === 404;
  const is401 = pathQuery.isError && pathQuery.error?.status === 401;

  const nextEntry = useMemo(() => nextIncompleteLesson(path), [path]);
  const quiz = path?.quiz && typeof path.quiz === "object" ? path.quiz : null;
  const unlock = quizUnlockState(path?.progressPercent, quiz?.passingScore);

  // The enrolled path occupying the free plan's single slot (if any).
  const activeEnrolledPath = useMemo(() => {
    const catalog = readLearningData(catalogQuery.data);
    return (
      flattenCatalog(catalog?.technologies).find(
        (p) => p.enrolled && String(p._id) !== String(pathId),
      ) || null
    );
  }, [catalogQuery.data, pathId]);

  const modules = useMemo(
    () => (Array.isArray(path?.modules) ? path.modules.filter((m) => m && typeof m === "object") : []),
    [path],
  );
  const defaultOpenId = nextEntry ? nextEntry.module?._id : modules[0]?._id;
  const isModuleOpen = (moduleId) => toggled[moduleId] ?? (moduleId === defaultOpenId);

  const handleStart = async () => {
    if (!isAuthenticated) {
      router.push(`/signin?redirect=/learn/${pathId}`);
      return;
    }
    setLimitBlocked(false);
    setActionError(null);
    try {
      await enroll({ pathId }).unwrap();
      // "Learning" tag invalidation refetches the path; jump straight in.
      router.push(
        nextEntry ? `/learn/${pathId}/lessons/${nextEntry.lesson._id}` : `/learn/${pathId}`,
      );
    } catch (err) {
      if (learningErrorCode(err) === "FREE_PATH_LIMIT") {
        setLimitBlocked(true);
      } else {
        setActionError(learnErrorMessage(err, "Couldn't start this path. Please try again."));
      }
    }
  };

  const handleSwitchPath = async () => {
    if (!activeEnrolledPath) return;
    setActionError(null);
    try {
      await release({ pathId: activeEnrolledPath._id }).unwrap();
      await enroll({ pathId }).unwrap();
      router.push(
        nextEntry ? `/learn/${pathId}/lessons/${nextEntry.lesson._id}` : `/learn/${pathId}`,
      );
    } catch (err) {
      setActionError(
        learnErrorMessage(err, "Couldn't switch paths. Your current path is unchanged."),
      );
    }
  };

  /* ── Loading / failure shells ── */
  if (pathQuery.isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-100 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-9 bg-slate-100 rounded-xl w-40" />
          </div>
          <Skeleton rows={6} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" />
        </div>
      </div>
    );
  }

  if (is401 && !isAuthenticated) {
    return (
      <LearnShell>
        <SignInPrompt
          title="Sign in to view this path"
          text="Learning paths, progress and quizzes are tied to your account."
          href={`/signin?redirect=/learn/${pathId}`}
        />
      </LearnShell>
    );
  }

  if (is404) {
    return (
      <LearnShell>
        <BackToCatalog />
        <ComingSoon
          title="This learning path isn't available yet"
          text="The path you're looking for hasn't been published on the server. Browse the catalog for what's live."
        />
      </LearnShell>
    );
  }

  if (loadFailed || !path) {
    return (
      <LearnShell>
        <ErrorNotice
          message={is401
            ? "Your session has expired. Sign in again to view this path."
            : pathQuery.error?.status
              ? "We couldn't load this learning path. Please try again."
              : "Couldn't reach the server. Check your connection and try again."}
          onRetry={() => pathQuery.refetch()}
        />
      </LearnShell>
    );
  }

  const enrolled = Boolean(path.enrolled);
  const allLessonsDone = !nextEntry;
  const totalLessons = flattenPathLessons(path).length;

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-12">
        <BackToCatalog />

        {/* ── Header ── */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-7 mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <LevelChip level={path.level} />
            {typeof path.skillName === "string" && path.skillName && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                <BookOpen className="w-3 h-3" aria-hidden="true" />
                {path.skillName}
              </span>
            )}
            {typeof path.technologyName === "string" && path.technologyName && (
              <span className="text-[11px] font-bold text-slate-400">{path.technologyName}</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{path.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 mb-4">
            {typeof path.estimatedHours === "number" && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                ~{path.estimatedHours} hours total
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              Quiz at the end
            </span>
          </div>

          {enrolled && (
            <ProgressBar
              percent={path.progressPercent}
              label={allLessonsDone ? "Lessons complete" : "Your progress"}
            />
          )}

          {/* ── Primary CTA ── */}
          <div className="mt-5">
            {!isAuthenticated ? (
              <Link
                href={`/signin?redirect=/learn/${pathId}`}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
              >
                Sign in to start <ArrowRight className="w-4 h-4" />
              </Link>
            ) : allLessonsDone ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/learn/${pathId}/quiz`}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
                >
                  <Trophy className="w-4 h-4" />
                  {quiz?.attempted ? "Retake quiz" : "Take the quiz"}
                </Link>
                {enrolled && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> All lessons completed
                  </span>
                )}
              </div>
            ) : enrolled ? (
              <Link
                href={`/learn/${pathId}/lessons/${nextEntry.lesson._id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
              >
                <Play className="w-4 h-4" />
                Continue: {nextEntry.lesson.title || "next lesson"}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                disabled={enrollState.isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enrollState.isLoading ? (
                  <><Sparkles className="w-4 h-4 animate-pulse" /> Enrolling…</>
                ) : (
                  <><Play className="w-4 h-4" /> Start path</>
                )}
              </button>
            )}
          </div>

          {/* ── FREE_PATH_LIMIT: honest switch-path flow ── */}
          {limitBlocked && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    The Free plan includes 1 active learning path.
                  </p>
                  {activeEnrolledPath ? (
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      You&apos;re learning <span className="font-black">{activeEnrolledPath.title}</span>.
                      Switching releases it (progress on completed lessons is kept) and enrolls you here instead.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Release your current path from the catalog page, then start this one.
                    </p>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    {activeEnrolledPath ? (
                      <button
                        type="button"
                        onClick={handleSwitchPath}
                        disabled={releaseState.isLoading || enrollState.isLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-amber-700 disabled:opacity-60"
                      >
                        {releaseState.isLoading || enrollState.isLoading
                          ? "Switching…"
                          : "Switch to this path"}
                      </button>
                    ) : (
                      <Link
                        href="/learn"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-black text-amber-800 transition hover:bg-amber-100"
                      >
                        Manage paths in the catalog
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setLimitBlocked(false)}
                      className="text-xs font-bold text-amber-700 underline hover:text-amber-900"
                    >
                      Keep my current path
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {actionError && (
            <div className="mt-4">
              <ErrorNotice message={actionError} />
            </div>
          )}
          {(releaseState.isLoading || enrollState.isLoading) && limitBlocked && (
            <p className="mt-3 text-xs font-bold text-slate-500 animate-pulse">Updating your enrollment…</p>
          )}
        </section>

        {/* ── Modules accordion ── */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5" aria-label="Course modules">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Modules</h2>
            {!enrolled && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Start the path to unlock lessons
              </span>
            )}
          </div>
          {modules.length === 0 && (
            <p className="px-6 py-5 text-sm text-slate-500">
              This path&apos;s module list hasn&apos;t been published yet.
            </p>
          )}
          {modules.map((mod, index) => {
            const lessons = Array.isArray(mod.lessons)
              ? mod.lessons.filter((l) => l && typeof l === "object")
              : [];
            const doneCount = lessons.filter((l) => l.completed).length;
            const open = isModuleOpen(mod._id);
            return (
              <div key={mod._id || index} className="border-b border-slate-50 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setToggled((prev) => ({ ...prev, [mod._id]: !open }))}
                  aria-expanded={open}
                  className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                    {index + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-black text-slate-900 truncate">{mod.title || `Module ${index + 1}`}</span>
                    <span className="block text-xs font-semibold text-slate-400">
                      {doneCount}/{lessons.length} lessons done
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {open && (
                  <ul className="pb-2">
                    {lessons.length === 0 && (
                      <li className="px-6 py-2 text-xs text-slate-400">No lessons listed yet.</li>
                    )}
                    {lessons.map((lesson, lessonIndex) => {
                      const row = (
                        <>
                          {lesson.completed ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" aria-hidden="true" />
                          ) : enrolled ? (
                            <span className="w-4 h-4 shrink-0 rounded-full border-2 border-slate-200" aria-hidden="true" />
                          ) : (
                            <Lock className="w-4 h-4 shrink-0 text-slate-300" aria-hidden="true" />
                          )}
                          <span className={`flex-1 text-sm font-semibold truncate ${lesson.completed ? "text-slate-400 line-through" : enrolled ? "text-slate-700" : "text-slate-400"}`}>
                            {lesson.title || `Lesson ${lessonIndex + 1}`}
                          </span>
                          {typeof lesson.durationMin === "number" && (
                            <span className="text-xs font-bold text-slate-400 shrink-0">{lesson.durationMin} min</span>
                          )}
                        </>
                      );
                      return (
                        <li key={lesson._id || lessonIndex}>
                          {enrolled ? (
                            <Link
                              href={`/learn/${pathId}/lessons/${lesson._id}`}
                              className="flex items-center gap-3 px-6 py-2.5 pl-[3.75rem] hover:bg-indigo-50/50 transition-colors"
                            >
                              {row}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-6 py-2.5 pl-[3.75rem]">
                              {row}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        {/* ── Quiz gate card ── */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" aria-label="Path quiz">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <Trophy className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-black text-slate-900">Final quiz</h2>
            {quiz?.passed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Passed
              </span>
            )}
          </div>

          {!unlock.unlocked ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                Locked — complete {unlock.requiredPercent}% of the lessons to unlock the quiz
                (you&apos;re at {unlock.progressPercent}%).
              </p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                The quiz is server-graded and you need{" "}
                {unlock.passingScore !== null ? `${unlock.passingScore}%` : "the passing score"} to
                earn the verified skill badge. Retakes are allowed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                {typeof quiz?.questionCount === "number"
                  ? `${quiz.questionCount} question${quiz.questionCount === 1 ? "" : "s"}, `
                  : "A short quiz — "}
                passing score {unlock.passingScore !== null ? `${unlock.passingScore}%` : "set by the server"}.
                Answers are graded on the server; pass and the verified badge is added to your profile.
              </p>
              {quiz?.attempted && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-700">
                    Best score: {typeof quiz.bestScore === "number" ? `${quiz.bestScore}%` : "—"}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Retakes allowed</span>
                </div>
              )}
              {isAuthenticated ? (
                <Link
                  href={`/learn/${pathId}/quiz`}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
                >
                  <Trophy className="w-4 h-4" />
                  {quiz?.attempted ? "Retake quiz" : "Start quiz"}
                </Link>
              ) : (
                <Link
                  href={`/signin?redirect=/learn/${pathId}/quiz`}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-200 px-4 py-2.5 text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Sign in to take the quiz
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LearnShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">{children}</div>
    </div>
  );
}

function BackToCatalog() {
  return (
    <Link
      href="/learn"
      className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> All learning paths
    </Link>
  );
}
