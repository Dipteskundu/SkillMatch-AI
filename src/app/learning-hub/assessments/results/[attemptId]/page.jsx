"use client";

/**
 * Detailed assessment result — owner-only (LH-020).
 * Data: GET /api/v1/learning/attempts/:attemptId/results
 * Shows the score, per-question answers with explanations, and the topic
 * breakdown with links back into the Learning Hub to revise weak topics.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PrivateGate, scoreTone } from "../../components/OverviewPieces";
import { fetchAttemptResults, apiErrorMessage } from "../../../../lib/learningApi";
import {
  ArrowLeft,
  Trophy,
  BookOpen,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Target,
  Ban,
} from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function AttemptResultPage() {
  return (
    <PrivateGate>
      <AttemptResultContent />
    </PrivateGate>
  );
}

function AttemptResultContent() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAttemptResults(attemptId);
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.status === 400
              ? "This attempt has not been submitted yet."
              : apiErrorMessage(err, "Could not load this result."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4" aria-busy="true">
        <div className="h-8 w-40 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl bg-white border border-red-100 p-8 text-center">
        <XCircle className="w-8 h-8 text-red-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm font-bold text-slate-900 mb-1">Result unavailable</p>
        <p className="text-sm text-slate-500 font-medium mb-5">{error || "Attempt not found."}</p>
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

  const weak = (result.topicBreakdown || []).filter((t) => t.percent < 60);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* ── Header ── */}
      <div>
        <Link
          href="/learning-hub/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to My Assessments
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{result.skill || "Assessment"}</h1>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold uppercase tracking-wider">
            {String(result.type || "assessment").replace(/[_-]/g, " ")}
          </span>
          {result.submittedAt && (
            <span className="text-xs text-slate-400 font-semibold">
              Submitted {new Date(result.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* ── Score summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-2xl border p-6 text-center ${
            scoreTone(result.score).bg
          }`}
        >
          <p className={`text-4xl font-black ${scoreTone(result.score).text}`}>{result.score}%</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-1">Final score</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center flex flex-col justify-center">
          <p className="text-3xl font-black text-slate-900">
            {result.correctCount}/{result.questionCount}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Correct answers</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
            Topic breakdown
          </p>
          <div className="space-y-1.5">
            {(result.topicBreakdown || []).slice(0, 4).map((t) => (
              <div key={t.topic} className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 truncate flex-1">{t.topic}</span>
                <span className={`text-xs font-black ${t.percent >= 60 ? "text-emerald-600" : t.percent >= 40 ? "text-amber-500" : "text-red-500"}`}>
                  {t.percent}%
                </span>
              </div>
            ))}
            {!(result.topicBreakdown || []).length && (
              <p className="text-xs text-slate-400 font-semibold">No topic data</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Weak topics + revise CTA ── */}
      {(weak.length > 0 || result.learningPlanId) && (
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Worth revising: {weak.map((t) => t.topic).join(", ")}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              These topics scored under 60% on this attempt.
            </p>
          </div>
          <Link
            href={result.learningPlanId ? `/learning-hub/my-learning` : "/learning-hub/paths"}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            {result.learningPlanId ? "Revise in my plan" : "Find lessons"}
          </Link>
        </div>
      )}

      {/* ── Question review ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">Question review</h2>
        {(result.questions || []).map((q, qi) => (
          <div key={q.questionId} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                <span className="text-indigo-600 font-black mr-1.5">{qi + 1}.</span>
                {q.question}
              </p>
              {q.correct ? (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Correct
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold uppercase tracking-wider">
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {q.yourIndex == null ? "Skipped" : "Incorrect"}
                </span>
              )}
            </div>

            <ul className="space-y-2 mb-3">
              {(q.options || []).map((opt, oi) => {
                const isCorrect = oi === q.correctIndex;
                const isYours = oi === q.yourIndex;
                const style = isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : isYours
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-100 bg-white text-slate-600";
                return (
                  <li
                    key={oi}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${style}`}
                  >
                    <span className="w-6 h-6 shrink-0 rounded-lg bg-white/70 border border-slate-200/70 flex items-center justify-center text-[11px] font-black">
                      {LETTERS[oi] ?? oi + 1}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <Trophy className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />}
                    {isYours && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />}
                  </li>
                );
              })}
              {q.yourIndex == null && (
                <li className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-500">
                  <Ban className="w-4 h-4 shrink-0" aria-hidden="true" />
                  You did not answer this question.
                </li>
              )}
            </ul>

            {q.explanation && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-black text-slate-700">Why: </span>
                  {q.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
