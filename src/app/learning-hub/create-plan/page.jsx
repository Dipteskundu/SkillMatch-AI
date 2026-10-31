"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import PageWrapper from "../../components/common/PageWrapper";
import {
  generatePlan,
  updatePlan,
  regeneratePlan,
  startDiagnostic,
  submitAttempt,
  apiErrorMessage,
} from "../../lib/learningApi";
import { useRequireLogin } from "../../lib/requireLogin";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Flag,
  Layers,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";

const DIAGNOSTIC_SLUG = "diagnostic-web-prerequisites";

// Mirrors the server-side validator in services/learningPlan.service.js.
const QUESTIONS = [
  {
    key: "goal",
    label: "What do you want to learn?",
    hint: "Be specific. This drives the entire roadmap.",
    placeholder: "e.g. React.js",
  },
  {
    key: "existingSkills",
    label: "What do you already know?",
    hint: "Comma separated. The plan builds on this, so honesty pays.",
    placeholder: "e.g. HTML, CSS, basic JavaScript",
  },
  {
    key: "proficiency",
    label: "How would you rate yourself?",
    hint: "Skip the modesty — an inaccurate level wastes your time.",
    options: [
      { value: "beginner", label: "Beginner", desc: "New to this area" },
      { value: "intermediate", label: "Intermediate", desc: "Built a few things already" },
      { value: "advanced", label: "Advanced", desc: "Comfortable and shipping" },
    ],
  },
  {
    key: "targetOutcome",
    label: "What are you aiming for?",
    hint: "This decides what the plan prioritises.",
    options: [
      { value: "job-preparation", label: "Land a job", desc: "Interview-ready, portfolio included" },
      { value: "project", label: "Build a project", desc: "Ship something real end to end" },
      { value: "interview", label: "Crack interviews", desc: "Targeted prep, not breadth" },
      { value: "general-learning", label: "Learn generally", desc: "No deadline, just depth" },
    ],
  },
  {
    key: "weeklyHours",
    label: "How many hours a week can you commit?",
    hint: "Be realistic — undercommitting is better than abandoning.",
    options: [
      { value: 4, label: "4 hours", desc: "Light — evenings only" },
      { value: 8, label: "8 hours", desc: "Steady part-time pace" },
      { value: 12, label: "12 hours", desc: "Serious weekly commitment" },
      { value: 20, label: "20 hours", desc: "Near full-time focus" },
    ],
  },
];

const OPTIONAL_FIELDS = [
  {
    key: "targetJobRole",
    label: "Target job role (optional)",
    placeholder: "e.g. Frontend Developer",
  },
  { key: "weakAreas", label: "Topics you find weak (optional)", placeholder: "e.g. async JavaScript" },
  { key: "completionWeeks", label: "Finish within (optional)", placeholder: "e.g. 8" },
  { key: "language", label: "Preferred explanation language (optional)", placeholder: "e.g. English" },
];

const PREFERENCES = ["explanations", "examples", "practical-exercises"];

export default function CreatePlanPage() {
  const router = useRouter();
  const requireLogin = useRequireLogin();

  const [step, setStep] = useState(0); // 0..4 required, 5 optional
  const [answers, setAnswers] = useState({
    goal: "",
    existingSkills: "",
    proficiency: "",
    targetOutcome: "",
    weeklyHours: "",
    targetJobRole: "",
    weakAreas: "",
    completionWeeks: "",
    language: "",
    learningPreference: [],
  });

  const [stage, setStage] = useState("discovery"); // discovery | generating | review | saved
  const [plan, setPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const [attempt, setAttempt] = useState(null);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState({});
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);

  const total = QUESTIONS.length;

  // Guests have no business here — bounce before the form is even visible.
  useEffect(() => {
    requireLogin();
  }, [requireLogin]);

  const canAdvance = useMemo(() => {
    const current = QUESTIONS[step];
    if (!current) return true;
    const value = answers[current.key];
    if (current.key === "goal") return String(value).trim().length >= 2;
    if (current.key === "existingSkills") {
      return String(value).split(",").some((s) => s.trim().length > 0);
    }
    return value !== "" && value !== null && value !== undefined;
  }, [answers, step]);

  const setAnswer = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = async () => {
    setError("");
    setStage("generating");
    try {
      const payload = {
        goal: answers.goal.trim(),
        existingSkills: answers.existingSkills,
        proficiency: answers.proficiency,
        targetOutcome: answers.targetOutcome,
        weeklyHours: Number(answers.weeklyHours),
      };
      if (answers.targetJobRole.trim()) payload.targetJobRole = answers.targetJobRole.trim();
      if (answers.weakAreas.trim()) payload.weakAreas = answers.weakAreas.trim();
      if (answers.completionWeeks.trim()) payload.completionWeeks = Number(answers.completionWeeks);
      if (answers.language.trim()) payload.language = answers.language.trim();
      if (answers.learningPreference.length) payload.learningPreference = answers.learningPreference;

      const created = await generatePlan(payload);
      setPlan(created);
      setStage("review");
    } catch (err) {
      setError(apiErrorMessage(err, "Plan generation failed. Please try again."));
      setStage("discovery");
      setStep(total); // land back on the optional step, not the start
    }
  };

  const handleRegenerate = async () => {
    if (!plan || busy) return;
    setError("");
    setBusy("regenerate");
    try {
      const updated = await regeneratePlan(plan._id);
      setPlan(updated);
    } catch (err) {
      setError(apiErrorMessage(err, "Regeneration failed. Your plan is unchanged."));
    } finally {
      setBusy("");
    }
  };

  const handleSave = async () => {
    if (!plan || saving) return;
    setError("");
    setSaving(true);
    try {
      const saved = await updatePlan(plan._id, {
        title: plan.title,
        status: "active",
      });
      setPlan(saved);
      setStage("saved");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save your plan. Please try again."));
      setSaving(false);
    }
  };

  const handleStartDiagnostic = async () => {
    if (!plan || busy) return;
    setError("");
    setBusy("start-diagnostic");
    try {
      const started = await startDiagnostic(DIAGNOSTIC_SLUG, plan._id);
      setAttempt(started);
      setDiagnosticAnswers({});
      setDiagnosticResult(null);
      setDiagnosticOpen(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not start the diagnostic. You can still continue."));
    } finally {
      setBusy("");
    }
  };

  const handleSkipDiagnostic = () => {
    // Skipping is client-only: nothing is written, the plan stays a draft and
    // the banner can be reopened from My Learning in a later phase.
    setDiagnosticOpen(false);
  };

  const handleSubmitDiagnostic = async () => {
    if (!attempt || busy) return;
    const unanswered = attempt.questions.filter((q) => diagnosticAnswers[q.id] === undefined);
    if (unanswered.length) {
      setError(`Answer every question — ${unanswered.length} still blank.`);
      return;
    }
    setError("");
    setBusy("submit-diagnostic");
    try {
      const payload = attempt.questions.map((q) => ({
        questionId: q.id,
        selectedIndex: diagnosticAnswers[q.id],
      }));
      const summary = await submitAttempt(attempt._id, payload);
      setDiagnosticResult(summary);
      setDiagnosticOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not submit your answers. Please try again."));
    } finally {
      setBusy("");
    }
  };

  const togglePreference = (value) =>
    setAnswers((prev) => ({
      ...prev,
      learningPreference: prev.learningPreference.includes(value)
        ? prev.learningPreference.filter((v) => v !== value)
        : [...prev.learningPreference, value],
    }));

  if (stage === "generating") return <GeneratingScreen />;

  if (stage === "saved") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <PageWrapper>
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-24 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-indigo-600" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-3">Plan saved.</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Your roadmap is live. Lessons unlock in Phase 3 — for now, revisit and
                adjust it any time from My Learning.
              </p>
              <Link
                href="/learning-hub/my-learning"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Go to My Learning
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </PageWrapper>
        </main>
        <Footer />
      </div>
    );
  }

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
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Personalised roadmap
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                  Answer five questions.
                  <span className="text-indigo-600"> Get a real plan.</span>
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
                  No generic syllabus. The plan is generated around what you already know,
                  how much time you have, and what you are actually aiming at.
                </p>
              </div>
            </div>
          </section>

          {stage === "discovery" && (
            <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 pb-24">
              {step < total ? (
                <QuestionCard
                  question={QUESTIONS[step]}
                  index={step}
                  total={total}
                  value={answers[QUESTIONS[step].key]}
                  onChange={(value) => setAnswer(QUESTIONS[step].key, value)}
                  onNext={() => setStep((s) => s + 1)}
                  onBack={() => setStep((s) => Math.max(0, s - 1))}
                  canAdvance={canAdvance}
                />
              ) : (
                <div className="bg-white border border-slate-100 rounded-3xl p-7 sm:p-9 premium-shadow">
                  <h2 className="text-2xl font-black text-slate-900 mb-1">Optional details</h2>
                  <p className="text-sm text-slate-500 mb-7">
                    Every field here is skippable. Anything you add sharpens the roadmap.
                  </p>

                  <div className="space-y-5">
                    {OPTIONAL_FIELDS.map((field) => (
                      <div key={field.key}>
                        <label
                          htmlFor={field.key}
                          className="block text-sm font-bold text-slate-700 mb-2"
                        >
                          {field.label}
                        </label>
                        <input
                          id={field.key}
                          type="text"
                          value={answers[field.key]}
                          onChange={(e) => setAnswer(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                      </div>
                    ))}

                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-2">
                        How do you prefer to learn? (optional)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PREFERENCES.map((pref) => {
                          const active = answers.learningPreference.includes(pref);
                          return (
                            <button
                              key={pref}
                              type="button"
                              onClick={() => togglePreference(pref)}
                              aria-pressed={active}
                              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                                active
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {active && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                              {pref}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {error && <ErrorNote message={error} />}

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm premium-shadow hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      Generate my plan
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {stage === "review" && plan && (
            <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 pb-24">
              {/* Diagnostic gate (LH-007) */}
              {!diagnosticResult && (
                <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-7 mb-6 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-indigo-600/40 blur-2xl" aria-hidden="true" />
                  <div className="relative">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-indigo-300" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Verify your starting level</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                          {plan.diagnostic?.recommended
                            ? `Recommended — ${(plan.diagnostic?.reasons || []).join("; ")}`
                            : "Optional"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Ten multiple-choice questions on the prerequisites, graded on the
                      server with topic-level feedback. Skipping never blocks your plan —
                      your self-reported level just stands unverified.
                    </p>

                    {!diagnosticOpen ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleStartDiagnostic}
                          disabled={busy === "start-diagnostic"}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60"
                        >
                          {busy === "start-diagnostic" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                              Starting…
                            </>
                          ) : (
                            <>
                              Take the diagnostic
                              <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleSkipDiagnostic}
                          className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white/10 border border-white/25 text-white font-bold text-sm hover:bg-white/20 active:scale-95 transition-all"
                        >
                          Skip for now
                        </button>
                      </div>
                    ) : (
                      <DiagnosticQuiz
                        attempt={attempt}
                        answers={diagnosticAnswers}
                        onAnswer={(qid, index) =>
                          setDiagnosticAnswers((prev) => ({ ...prev, [qid]: index }))
                        }
                        onSubmit={handleSubmitDiagnostic}
                        submitting={busy === "submit-diagnostic"}
                      />
                    )}
                  </div>
                </div>
              )}

              {diagnosticResult && (
                <div className="rounded-3xl bg-indigo-50 border border-indigo-100 p-6 mb-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center">
                      <span className="text-xl font-black text-indigo-600">
                        {diagnosticResult.score}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <h3 className="font-bold text-slate-900">Baseline check complete</h3>
                      <p className="text-sm text-slate-600">
                        {diagnosticResult.correctCount} of {diagnosticResult.questionCount} correct.
                        {diagnosticResult.weakTopics?.length
                          ? ` Focus on: ${diagnosticResult.weakTopics.join(", ")}.`
                          : " No weak topics detected."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && <ErrorNote message={error} />}

              <PlanReview
                plan={plan}
                onChange={(patch) => setPlan((prev) => ({ ...prev, ...patch }))}
              />

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" aria-hidden="true" />
                      Save this plan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={busy === "regenerate" || saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm premium-shadow hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60"
                >
                  {busy === "regenerate" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                      Regenerate
                    </>
                  )}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Nothing is saved until you press Save. Regenerating replaces the draft.
              </p>
            </section>
          )}
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function QuestionCard({ question, index, total, value, onChange, onNext, onBack, canAdvance }) {
  const isChoice = Boolean(question.options);
  const id = `q-${question.key}`;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-7 sm:p-9 premium-shadow">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
          Question {index + 1} of {total}
        </span>
        <span className="text-xs font-bold text-slate-400">{Math.round(((index + 1) / total) * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 mb-8 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <h2 className="text-2xl font-black text-slate-900 mb-2">{question.label}</h2>
      <p className="text-sm text-slate-500 mb-7">{question.hint}</p>

      {isChoice ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((option) => {
            const active = String(value) === String(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                aria-pressed={active}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  active
                    ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100 hover:bg-indigo-100"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="block font-bold text-slate-900 mb-0.5">{option.label}</span>
                <span className="block text-xs text-slate-500">{option.desc}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canAdvance) onNext();
          }}
          className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={index === 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm premium-shadow hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          Continue
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function GeneratingScreen() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageWrapper>
          <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-28 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">
              Building your roadmap…
            </h1>
            <p className="text-slate-500 leading-relaxed">
              Sequencing modules around your existing skills and weekly hours.
              This usually takes under a minute.
            </p>
          </div>
        </PageWrapper>
      </main>
      <Footer />
    </div>
  );
}

function DiagnosticQuiz({ attempt, answers, onAnswer, onSubmit, submitting }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/15 p-5">
      <p className="text-sm font-bold mb-4">
        {attempt?.questionCount} questions · no time limit · graded on submit
      </p>

      <ol className="space-y-6">
        {(attempt?.questions || []).map((q, qi) => (
          <li key={q.id}>
            <p className="font-bold text-sm mb-3">
              <span className="text-indigo-300 mr-2">{qi + 1}.</span>
              {q.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((option, oi) => {
                const active = answers[q.id] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => onAnswer(q.id, oi)}
                    aria-pressed={active}
                    className={`text-left rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-indigo-500/30 border-indigo-400 text-white hover:bg-indigo-500/40"
                        : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Grading…
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Submit answers
          </>
        )}
      </button>
    </div>
  );
}

function PlanReview({ plan, onChange }) {
  const [editingTitle, setEditingTitle] = useState(false);

  const stats = [
    { icon: Layers, label: `${plan.moduleCount} modules` },
    { icon: Clock, label: `${plan.lessonCount} lessons` },
    { icon: Timer, label: `${plan.weeklyHours} h/week` },
    { icon: TrendingUp, label: `${plan.estimatedWeeks} weeks` },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-7 sm:p-9 premium-shadow">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-[240px]">
          {editingTitle ? (
            <input
              autoFocus
              defaultValue={plan.title}
              onBlur={(e) => {
                onChange({ title: e.target.value.trim() || plan.title });
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full text-2xl font-black text-slate-900 border-b-2 border-indigo-300 focus:outline-none pb-1"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="text-left text-2xl font-black text-slate-900 hover:text-indigo-600 transition-colors"
              title="Click to rename"
            >
              {plan.title}
            </button>
          )}
          <p className="text-sm text-slate-500 mt-1 capitalize">
            {plan.startingLevel} → {String(plan.targetOutcome).replace(/-/g, " ")}
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold uppercase tracking-widest text-indigo-600">
          Draft
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-7 pb-7 border-b border-slate-100">
        {stats.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Icon className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      {plan.expectedOutcomes?.length > 0 && (
        <div className="mb-7">
          <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            What you&apos;ll be able to do
          </h3>
          <ul className="space-y-2">
            {plan.expectedOutcomes.map((outcome) => (
              <li key={outcome} className="text-sm text-slate-600 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-3 text-sm">
        <Layers className="w-4 h-4 text-indigo-600" aria-hidden="true" />
        Modules
      </h3>
      <ol className="space-y-3">
        {plan.modules.map((mod) => (
          <li key={mod.order} className="rounded-2xl border border-slate-100 p-4">
            <details>
              <summary className="cursor-pointer flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black flex items-center justify-center">
                    {mod.order}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{mod.title}</span>
                </span>
                <span className="inline-flex items-center gap-3 text-xs font-semibold text-slate-400">
                  <span>{mod.lessons.length} items</span>
                  <span>{mod.estimatedHours} h</span>
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </span>
              </summary>
              <ol className="mt-4 space-y-2 pl-4 border-l-2 border-indigo-100 ml-3">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.order} className="flex items-start gap-2.5 text-sm">
                    <span className="text-slate-400 shrink-0 mt-0.5">
                      {lesson.kind === "activity" ? (
                        <Compass className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Flag className="w-4 h-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="text-slate-700">{lesson.title}</span>
                    <span className="ml-auto text-xs font-semibold text-slate-400 shrink-0">
                      {lesson.durationMinutes} min
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ErrorNote({ message }) {
  return (
    <p
      role="alert"
      className="mt-4 text-sm font-semibold text-indigo-600 inline-flex items-center gap-2"
    >
      <X className="w-4 h-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
