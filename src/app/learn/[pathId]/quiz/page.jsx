"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useGetLearningQuizQuery,
  useSubmitLearningQuizMutation,
} from "../../../store/api/apiSlice";
import {
  learnErrorMessage,
  readLearningData,
} from "../../../lib/learning";
import { scoreBand } from "../../../lib/scoreDisplay";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Loader2,
  Lock,
  RefreshCw,
  Target,
  Trophy,
} from "lucide-react";
import {
  Skeleton,
  ErrorNotice,
  ComingSoon,
  SignInPrompt,
} from "../../components/LearnBits";

/**
 * Quiz player at /learn/[pathId]/quiz — one question per card, answers are
 * graded SERVER-SIDE at submit (nothing is trusted client-side). QUIZ_LOCKED
 * 403s bounce back to the path with the unlock rule spelled out.
 */
export default function LearningQuizPage() {
  const { pathId } = useParams();

  const quizQuery = useGetLearningQuizQuery(pathId);
  const [submitQuiz, submitState] = useSubmitLearningQuizMutation();

  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);

  const payload = useMemo(() => readLearningData(quizQuery.data), [quizQuery.data]);
  const quiz = payload?.quiz && typeof payload.quiz === "object" ? payload.quiz : null;
  const questions = useMemo(
    () => (Array.isArray(quiz?.questions) ? quiz.questions.filter((q) => q && typeof q === "object") : []),
    [quiz],
  );

  const quizFailed =
    quizQuery.isError || Boolean(quizQuery.data && quizQuery.data.success === false);
  const quiz401 = quizQuery.isError && quizQuery.error?.status === 401;
  const quiz404 = quizQuery.isError && quizQuery.error?.status === 404;
  const quizLocked = quizQuery.isError && quizQuery.error?.status === 403;

  const question = questions[current];
  const answeredCount = questions.filter((q) => typeof answers[q._id] === "number").length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const handleSelect = (questionId, choice) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    try {
      const data = await submitQuiz({
        pathId,
        answers: questions.map((q) => ({ questionId: q._id, choice: answers[q._id] })),
      }).unwrap();
      const body = readLearningData(data);
      if (body && typeof body === "object") setResult(body);
    } catch {
      // Error rendered from submitState below.
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrent(0);
    setResult(null);
  };

  /* ── Shells ── */
  if (quizQuery.isLoading) {
    return (
      <QuizShell>
        <Skeleton rows={5} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" />
      </QuizShell>
    );
  }

  if (quiz401) {
    return (
      <QuizShell>
        <BackToPath pathId={pathId} />
        <SignInPrompt
          title="Sign in to take the quiz"
          text="Quiz attempts and earned badges are tied to your account."
          href={`/signin?redirect=/learn/${pathId}/quiz`}
        />
      </QuizShell>
    );
  }

  if (quizLocked) {
    return (
      <QuizShell>
        <BackToPath pathId={pathId} />
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-10 text-center">
          <div className="inline-flex p-2.5 bg-amber-50 rounded-xl mb-3">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-base font-black text-slate-900 mb-2">The quiz is still locked</p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto mb-5">
            Finish at least 80% of the path&apos;s lessons first — the quiz unlocks at that
            point. Your lesson progress is saved, so just pick up where you left off.
          </p>
          <Link
            href={`/learn/${pathId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700 transition-colors"
          >
            Back to the path <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </QuizShell>
    );
  }

  if (quiz404) {
    return (
      <QuizShell>
        <BackToPath pathId={pathId} />
        <ComingSoon
          title="This quiz isn't available yet"
          text="The server hasn't published questions for this path. Check back soon — nothing is faked in the meantime."
        />
      </QuizShell>
    );
  }

  if (quizFailed || questions.length === 0) {
    return (
      <QuizShell>
        <BackToPath pathId={pathId} />
        <ErrorNotice
          message={quizQuery.error?.status
            ? "We couldn't load this quiz. Please try again."
            : "Couldn't reach the server. Check your connection and try again."}
          onRetry={() => quizQuery.refetch()}
        />
      </QuizShell>
    );
  }

  /* ── Result view ── */
  if (result) {
    const passed = result.passed === true;
    const score = typeof result.score === "number" ? result.score : null;
    const badge = result.badge && typeof result.badge === "object" ? result.badge : null;
    const jobs = Array.isArray(result.jobsYouCanNowApplyTo) ? result.jobsYouCanNowApplyTo : [];
    const verifiedSkills = Array.isArray(result.newlyVerifiedSkills)
      ? result.newlyVerifiedSkills.filter((s) => typeof s === "string" && s)
      : [];

    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <BackToPath pathId={pathId} />

          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7 mt-4 text-center">
            <ScoreRing score={score} passed={passed} passingScore={quiz.passingScore} />
            <p className={`text-lg font-black mt-4 ${passed ? "text-emerald-600" : "text-amber-600"}`}>
              {passed ? "Quiz passed!" : "Not this time"}
            </p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {passed
                ? `You scored ${score ?? "—"}% (passing score ${quiz.passingScore ?? "—"}%).`
                : `You scored ${score ?? "—"}%; the passing score is ${quiz.passingScore ?? "—"}%. Review the lessons and retake it — retakes are allowed.`}
            </p>
            {typeof result.attempts === "number" && result.attempts > 0 && (
              <p className="text-xs font-bold text-slate-400 mt-2">Attempt {result.attempts}</p>
            )}
          </section>

          {passed && (
            <section className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 mt-4" aria-label="Earned badge">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900">
                    {badge?.skillName || "Verified skill"} — verified
                  </p>
                  <p className="text-xs text-slate-500">
                    Verified skill added to your profile (source: learning).
                  </p>
                </div>
              </div>
              {badge?.verifiableCode && (
                <p className="text-left text-[11px] font-mono text-slate-400 break-all">
                  Code: {badge.verifiableCode}
                </p>
              )}
              {verifiedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {verifiedSkills.map((skill) => (
                    <span key={skill} className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {passed && jobs.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-4" aria-label="Jobs you can now apply to">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                <h2 className="text-sm font-black text-slate-900">Jobs you can now apply to</h2>
              </div>
              <ul className="space-y-2">
                {jobs.map((job) => {
                  if (!job || typeof job !== "object") return null;
                  const band = scoreBand(job.fitScore);
                  return (
                    <li key={job._id || job.title}>
                      <Link
                        href={`/jobs/${job._id}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
                      >
                        <span className="flex-1 min-w-0 text-left">
                          <span className="block text-sm font-bold text-slate-800 truncate">{job.title}</span>
                          {job.company && (
                            <span className="block text-xs font-semibold text-slate-400 truncate">{job.company}</span>
                          )}
                        </span>
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-black ${band.className}`}>
                          {typeof job.fitScore === "number" ? `${job.fitScore}% fit` : band.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retake quiz
            </button>
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

  /* ── Question wizard ── */
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <BackToPath pathId={pathId} />
          <span className="text-xs font-black text-slate-500">
            Question {current + 1} of {questions.length}
          </span>
        </div>

        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6" aria-hidden="true">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>

        {submitState.isError && (
          <div className="mb-4">
            <ErrorNotice
              message={learnErrorMessage(submitState.error, "Couldn't submit your answers. Please try again.")}
              onRetry={handleSubmit}
            />
          </div>
        )}
        {submitState.data && submitState.data.success === false && (
          <div className="mb-4">
            <ErrorNotice
              message={submitState.data.message || "Couldn't submit your answers. Please try again."}
              onRetry={handleSubmit}
            />
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-7" aria-live="polite">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              Question {current + 1}
            </span>
            {typeof quiz.passingScore === "number" && (
              <span className="ml-auto text-[11px] font-bold text-slate-400">
                Passing score: {quiz.passingScore}%
              </span>
            )}
          </div>

          <h1 className="text-lg font-black text-slate-900 leading-snug mb-5">
            {question.prompt}
          </h1>

          <fieldset>
            <legend className="sr-only">{question.prompt}</legend>
            <div className="space-y-2.5">
              {(Array.isArray(question.options) ? question.options : []).map((option, index) => {
                const selected = answers[question._id] === index;
                return (
                  <label
                    key={index}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors ${
                      selected
                        ? "border-indigo-400 bg-indigo-50/60"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={index}
                      checked={selected}
                      onChange={() => handleSelect(question._id, index)}
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                        selected ? "border-indigo-500" : "border-slate-300"
                      }`}
                      aria-hidden="true"
                    >
                      {selected && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {current < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-700 transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered || submitState.isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitState.isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Grading…</>
                ) : (
                  <><Trophy className="w-4 h-4" /> Submit quiz</>
                )}
              </button>
            )}
          </div>

          <p className="mt-4 text-xs font-semibold text-slate-400 text-right">
            {answeredCount} of {questions.length} answered
            {!allAnswered && " — answer every question to submit"}
          </p>
        </section>
      </div>
    </div>
  );
}

/** Circular score display styled like the Fit Map ring. */
function ScoreRing({ score, passed, passingScore }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const value = typeof score === "number" && Number.isFinite(score) ? score : null;
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  const strokeDash = ((clamped / 100) * circumference).toFixed(1);
  const color = passed ? "#10b981" : "#f59e0b";

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" aria-hidden="true">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-4xl font-black text-slate-900 leading-none">
          {value !== null ? value : "–"}
        </span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
          {value !== null ? "Score" : "Ungraded"}
        </span>
        {typeof passingScore === "number" && (
          <span className="text-[10px] font-bold text-slate-400 mt-0.5">Pass: {passingScore}%</span>
        )}
      </div>
    </div>
  );
}

function QuizShell({ children }) {
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
