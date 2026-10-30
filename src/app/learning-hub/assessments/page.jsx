"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import PageWrapper from "../../components/common/PageWrapper";
import SectionHeading from "../../components/learning/SectionHeading";
import { useRequireLogin } from "../../lib/requireLogin";
import {
  ClipboardCheck,
  Target,
  BookOpenCheck,
  Layers,
  Flag,
  ListChecks,
  Code2,
  PenLine,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const ASSESSMENT_TYPES = [
  {
    icon: Target,
    title: "Diagnostic",
    when: "Optional · before plan generation",
    desc: "A short baseline check that verifies prerequisite knowledge. Skip it and your self-reported proficiency stands unverified — it never blocks your roadmap.",
    color: "bg-violet-50 border-violet-100 text-violet-600",
  },
  {
    icon: BookOpenCheck,
    title: "Lesson Knowledge Check",
    when: "After each lesson",
    desc: "A few formative questions at the end of a lesson so you know the concept landed before moving on.",
    color: "bg-emerald-50 border-emerald-100 text-emerald-600",
  },
  {
    icon: Layers,
    title: "Module Assessment",
    when: "End of a module",
    desc: "Evaluates the module's stated objectives as a whole — not just the last lesson.",
    color: "bg-indigo-50 border-indigo-100 text-indigo-600",
  },
  {
    icon: ClipboardCheck,
    title: "Standalone Skill Assessment",
    when: "Anytime",
    desc: "Test one technology independently of any plan. Useful for checking a skill you already have.",
    color: "bg-amber-50 border-amber-100 text-amber-600",
  },
  {
    icon: Flag,
    title: "Final Path Assessment",
    when: "End of a path",
    desc: "Assesses overall learning outcomes across the full roadmap, with recommendations for what to revisit.",
    color: "bg-rose-50 border-rose-100 text-rose-600",
  },
];

const FORMATS = [
  {
    icon: ListChecks,
    label: "Multiple choice",
    eval: "Server-side answer key",
    desc: "Four options, one correct answer. Graded the moment you submit — no waiting.",
    locked: "Answers never sent to your browser",
  },
  {
    icon: Code2,
    label: "Code output",
    eval: "Server-side expected output",
    desc: "Read a snippet and predict exactly what it prints. The output is compared on the server.",
    locked: "Snippets are displayed, never executed",
  },
  {
    icon: PenLine,
    label: "Short written answer",
    eval: "Rubric-based, AI-assisted",
    desc: "Explain a concept in your own words. Evaluated against a fixed rubric with feedback attached.",
    locked: "AI-evaluated responses are labeled",
  },
];

const WORKFLOW = [
  "Select assessment",
  "Start attempt",
  "Answer questions",
  "Submit",
  "Grade",
  "View results",
  "Receive recommendations",
];

export default function AssessmentsPage() {
  const requireLogin = useRequireLogin();

  // Phase 1 gates the button without a dead click; Phase 4 wires this to
  // POST /api/v1/learning/assessments/:id/start.
  const handleStart = () => {
    if (!requireLogin()) return;
    window.location.assign("/learning-hub/paths");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <PageWrapper>
          {/* ── Header ── */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient" aria-hidden="true" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-12">
              <div className="animate-fade-up max-w-3xl">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5">
                  <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  Skill assessments
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                  Find out what you
                  <span className="text-indigo-600"> actually know.</span>
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
                  Five assessment types, three question formats, graded on the
                  server. Every result comes with topic-level feedback and the
                  lessons that would fix your weak spots.
                </p>
              </div>
            </div>
          </section>

          {/* ── Workflow ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
              {WORKFLOW.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-700 premium-shadow">
                    <span className="text-indigo-600">{i + 1}</span>
                    {step}
                  </span>
                  {i < WORKFLOW.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* ── Assessment types ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <SectionHeading
              eyebrow="Assessment types"
              title="Five ways your knowledge gets checked"
              description="Types are chosen by where you are in your plan — you rarely pick them manually."
            />

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ASSESSMENT_TYPES.map(({ icon: Icon, title, when, desc, color }) => (
                <div
                  key={title}
                  className="bg-white border border-slate-100 rounded-3xl p-6 premium-shadow card-hover reveal flex flex-col"
                >
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${color}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-3">
                    {when}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}

              {/* Practice-vs-hiring note fills the grid */}
              <div className="rounded-3xl p-6 bg-slate-900 text-white flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-indigo-600/40 blur-2xl" aria-hidden="true" />
                <ShieldCheck className="w-7 h-7 text-indigo-300 mb-3 relative" aria-hidden="true" />
                <p className="font-bold mb-1.5 relative">Practice ≠ hiring evidence</p>
                <p className="text-sm text-slate-400 leading-relaxed relative">
                  Learning Hub scores are private to you and stay out of your
                  recruitment assessment records entirely.
                </p>
              </div>
            </div>
          </section>

          {/* ── Question formats ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <SectionHeading
              eyebrow="Question formats"
              title="Three formats in the MVP"
              description="Each format is graded the moment you submit, and each keeps its answer key on the server."
            />

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {FORMATS.map(({ icon: Icon, label, eval: evalLabel, desc, locked }) => (
                <div
                  key={label}
                  className="bg-white border border-slate-100 rounded-3xl p-6 premium-shadow card-hover reveal flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{label}</h3>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        {evalLabel}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 leading-relaxed mb-5">{desc}</p>

                  <div className="mt-auto flex items-start gap-2.5 pt-4 border-t border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-xs font-semibold text-slate-600">{locked}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Integrity + CTA ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-7 premium-shadow">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  How integrity is handled
                </h3>
                <ul className="space-y-3">
                  {[
                    "Answer keys and grading rules stay on the server",
                    "Question order and options are randomized per attempt",
                    "Attempts are validated for ownership and time limits",
                    "Attempts are stored separately from learning progress",
                    "Your submitted code is never executed",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-7 sm:p-9 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
                <div className="relative">
                  <h3 className="text-2xl font-black mb-3">Take your first assessment</h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-md">
                    Sign in to start a tracked attempt. Results, topic breakdown,
                    and recommendations are saved to your private history.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleStart}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-indigo-700 font-bold text-sm hover:bg-slate-100 hover:-translate-y-0.5 transition-all"
                    >
                      Start an assessment
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <Link
                      href="/learning-hub/paths"
                      className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white/10 border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-all"
                    >
                      Browse paths first
                    </Link>
                  </div>

                  <p className="mt-5 text-xs text-white/70 inline-flex items-center gap-1.5">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Tracked attempts require a free account.
                  </p>
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
