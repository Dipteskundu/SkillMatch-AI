"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/AuthContext";
import {
  useGetLearningLessonQuery,
  useGetLearningPathQuery,
  useCompleteLearningLessonMutation,
} from "../../../../store/api/apiSlice";
import {
  dailyLimitCopy,
  flattenPathLessons,
  isValidLessonContent,
  learnErrorMessage,
  learningErrorCode,
  readLearningData,
} from "../../../../lib/learning";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import {
  Skeleton,
  ErrorNotice,
  ComingSoon,
  SignInPrompt,
} from "../../../components/LearnBits";

/**
 * Lesson player at /learn/[pathId]/lessons/[lessonId].
 * Renders the structured lesson-content JSON directly (no markdown dep) and
 * enforces the Free plan's daily lesson cap honestly via the 403
 * DAILY_LESSON_LIMIT code from the backend.
 */
export default function LessonPlayerPage() {
  const { pathId, lessonId } = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const lessonQuery = useGetLearningLessonQuery({ pathId, lessonId });
  const pathQuery = useGetLearningPathQuery(pathId, { skip: !isAuthenticated });
  const [completeLesson, completeState] = useCompleteLearningLessonMutation();

  const lessonPayload = useMemo(
    () => readLearningData(lessonQuery.data),
    [lessonQuery.data],
  );
  const lesson = lessonPayload?.lesson && typeof lessonPayload.lesson === "object"
    ? lessonPayload.lesson
    : null;
  const entitlement = lessonPayload?.entitlement ?? null;
  const remainingToday =
    entitlement && typeof entitlement.remainingToday === "number"
      ? entitlement.remainingToday
      : null;

  const pathPayload = useMemo(() => readLearningData(pathQuery.data), [pathQuery.data]);
  const path = pathPayload?.path && typeof pathPayload.path === "object" ? pathPayload.path : null;

  const lessonFailed =
    lessonQuery.isError || Boolean(lessonQuery.data && lessonQuery.data.success === false);
  const lesson401 = lessonQuery.isError && lessonQuery.error?.status === 401;
  const lesson404 = lessonQuery.isError && lessonQuery.error?.status === 404;
  const dailyLimitHit =
    lessonQuery.isError && learningErrorCode(lessonQuery.error) === "DAILY_LESSON_LIMIT";
  const notEnrolled403 =
    lessonQuery.isError && lessonQuery.error?.status === 403 && !dailyLimitHit;

  const content = lesson?.content;
  const contentValid = isValidLessonContent(content);

  const handleComplete = async () => {
    try {
      await completeLesson({ pathId, lessonId }).unwrap();
    } catch {
      // Error state is rendered from completeState below.
      return;
    }
    // Find the next lesson from the path structure (falls back to the path
    // overview when it hasn't loaded).
    const entries = flattenPathLessons(path);
    const index = entries.findIndex((entry) => String(entry.lesson._id) === String(lessonId));
    const next = index >= 0 ? entries[index + 1] : null;
    router.push(next ? `/learn/${pathId}/lessons/${next.lesson._id}` : `/learn/${pathId}`);
  };

  const completeError = completeState.isError
    ? learnErrorMessage(completeState.error, "Couldn't mark this lesson complete. Try again.")
    : completeState.data && completeState.data.success === false
      ? completeState.data.message || "Couldn't mark this lesson complete. Try again."
      : null;

  /* ── Shells for every honest down state ── */
  if (lessonQuery.isLoading || authLoading) {
    return (
      <LessonShell>
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse" aria-hidden="true">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-7 bg-slate-100 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-40 bg-slate-100 rounded-2xl w-full" />
        </div>
      </LessonShell>
    );
  }

  if (lesson401 && !isAuthenticated) {
    return (
      <LessonShell>
        <SignInPrompt
          title="Sign in to open this lesson"
          text="Lessons, progress and daily limits are tied to your account."
          href={`/signin?redirect=/learn/${pathId}/lessons/${lessonId}`}
        />
      </LessonShell>
    );
  }

  if (dailyLimitHit) {
    return (
      <LessonShell>
        <BackToPath pathId={pathId} />
        <div className="max-w-2xl mx-auto rounded-2xl border border-amber-100 bg-amber-50 px-6 py-8 text-center">
          <div className="inline-flex p-2.5 bg-amber-100 rounded-xl mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-base font-black text-slate-900 mb-2">
            That&apos;s today&apos;s Free plan lesson limit
          </p>
          <p className="text-sm text-amber-800 leading-relaxed max-w-md mx-auto mb-1">
            {dailyLimitCopy(0)}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            The Free plan is capped at 3 lessons per day so the platform stays sustainable.
            A Pro plan will lift the daily limit (and path limits) to unlimited — paid plans
            aren&apos;t set up yet, so there&apos;s nothing to buy today. Your progress and
            streak are saved; pick this lesson up tomorrow.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href={`/learn/${pathId}`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-black text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to the path
            </Link>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Browse other paths
            </Link>
          </div>
        </div>
      </LessonShell>
    );
  }

  if (notEnrolled403) {
    return (
      <LessonShell>
        <BackToPath pathId={pathId} />
        <div className="max-w-2xl mx-auto">
          <ComingSoon
            title="Enroll to open this lesson"
            text={learnErrorMessage(
              lessonQuery.error,
              "Lessons unlock once you start the path. Head back and press \"Start path\".",
            )}
          />
          <div className="text-center mt-4">
            <Link
              href={`/learn/${pathId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700 transition-colors"
            >
              Go to the path <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </LessonShell>
    );
  }

  if (lesson404) {
    return (
      <LessonShell>
        <BackToPath pathId={pathId} />
        <ComingSoon
          title="This lesson isn't available yet"
          text="It hasn't been published on the server. Pick another lesson from the path."
        />
      </LessonShell>
    );
  }

  if (lessonFailed || !lesson) {
    return (
      <LessonShell>
        <BackToPath pathId={pathId} />
        <ErrorNotice
          message={lesson401
            ? "Your session has expired. Sign in again to open this lesson."
            : lessonQuery.error?.status
              ? "We couldn't load this lesson. Please try again."
              : "Couldn't reach the server. Check your connection and try again."}
          onRetry={() => lessonQuery.refetch()}
        />
      </LessonShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="flex items-center justify-between gap-3 mb-6">
          <BackToPath pathId={pathId} />
          {remainingToday !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-black text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {dailyLimitCopy(remainingToday)}
            </span>
          )}
        </div>

        <article>
          <h1 className="text-2xl font-black text-slate-900 mb-6">{lesson.title}</h1>

          {contentValid ? (
            <LessonContent content={content} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center">
              <BookOpen className="w-7 h-7 text-slate-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-black text-slate-600 mb-1">
                This lesson&apos;s written content isn&apos;t available yet
              </p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                The lesson is listed in the path, but the server hasn&apos;t published its
                content. Nothing is filled in placeholder-style — check back soon or
                explore another lesson.
              </p>
            </div>
          )}
        </article>

        {completeError && (
          <div className="mt-6">
            <ErrorNotice message={completeError} />
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
          {contentValid ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={completeState.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {completeState.isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Mark complete &amp; continue</>
              )}
            </button>
          ) : (
            <Link
              href={`/learn/${pathId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
            >
              Back to the path <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href={`/learn/${pathId}`}
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Back to path overview
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Renders the lesson content JSON: intro, sections (paragraphs / lists /
 * code blocks) and takeaways — structured, so no markdown dependency. */
function LessonContent({ content }) {
  return (
    <div className="space-y-8">
      {content.intro && (
        <p className="text-base text-slate-700 leading-relaxed border-l-4 border-indigo-200 pl-4">
          {content.intro}
        </p>
      )}

      {content.sections.map((section, index) => (
        <section key={`${section.heading}-${index}`}>
          <h2 className="text-lg font-black text-slate-900 mb-3">{section.heading}</h2>
          <div className="space-y-3">
            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex} className="text-sm text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          {Array.isArray(section.list) && section.list.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {section.list.map((item, lIndex) => (
                <li key={lIndex} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {section.code && typeof section.code.text === "string" && (
            <pre className="mt-4 rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs leading-relaxed">
              <code>{section.code.text}</code>
            </pre>
          )}
        </section>
      ))}

      {Array.isArray(content.takeaways) && content.takeaways.length > 0 && (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ListChecks className="w-4 h-4" aria-hidden="true" /> Key takeaways
          </h3>
          <ul className="space-y-2">
            {content.takeaways.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function LessonShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">{children}</div>
    </div>
  );
}

function BackToPath({ pathId }) {
  return (
    <Link
      href={`/learn/${pathId}`}
      className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Back to path
    </Link>
  );
}
