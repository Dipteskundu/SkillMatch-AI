"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import PageWrapper from "../components/common/PageWrapper";
import SectionHeading from "../components/learning/SectionHeading";
import PathCard from "../components/learning/PathCard";
import { PathCardSkeleton } from "../components/learning/Skeletons";
import { fetchPaths } from "../lib/learningApi";
import { useRequireLogin } from "../lib/requireLogin";
import {
  Sparkles,
  Compass,
  Route,
  BrainCircuit,
  ClipboardCheck,
  GraduationCap,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Target,
  Clock,
  RefreshCcw,
} from "lucide-react";

const HOW_IT_WORKS = [
  { icon: Compass, title: "Explore", desc: "Browse curated paths and previews — no sign-in needed." },
  { icon: Target, title: "Set Goals", desc: "Tell the AI your goal, current skills, and available time." },
  { icon: Route, title: "Generate Plan", desc: "Receive a structured roadmap with modules and schedule." },
  { icon: GraduationCap, title: "Learn", desc: "Study in-app lessons with an AI assistant beside you." },
  { icon: ClipboardCheck, title: "Assess", desc: "Prove it with MCQ, code-output, and short-answer tests." },
  { icon: LineChart, title: "Improve", desc: "Track weak topics and get targeted next lessons." },
];

const FORMATS = [
  {
    label: "Multiple choice",
    desc: "Select the correct statement — graded instantly on the server.",
    example: "Which keyword declares a block-scoped constant?",
    options: ["const", "var", "function", "static"],
    answer: 0,
  },
  {
    label: "Code output",
    desc: "Predict what a snippet prints before you run it.",
    example: "console.log([1,2,3].map(n => n * 2));",
    answer: "[2, 4, 6]",
  },
  {
    label: "Short written answer",
    desc: "Explain a concept — evaluated against a rubric with AI feedback.",
    example: "Explain the difference between let and const.",
    answer: "Rubric-based, labeled as AI-evaluated",
  },
];

const BENEFITS = [
  "Personalized roadmap from your real starting point",
  "Lessons taught inside the app — no tab-hopping",
  "Practice scores stay private and separate from hiring",
  "Resume any plan exactly where you stopped",
  "Diagnostic test optional — skip it and still generate",
  "Every account type can learn, including recruiters",
];

export default function LearningHubPage() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requireLogin = useRequireLogin();
  const router = useRouter();

  // Guests bounce through sign-in and return here (LH-004). Signed-in users
  // go straight to the plan wizard.
  const handleCreatePlan = () => {
    if (!requireLogin()) return;
    router.push("/learning-hub/create-plan");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPaths();
        if (!cancelled) setPaths(data.slice(0, 6));
      } catch {
        if (!cancelled) setError("Could not load learning paths right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <PageWrapper>
          {/* ── 1. Hero ─────────────────────────────────────── */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient" aria-hidden="true" />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[64rem] h-[64rem] rounded-full bg-indigo-600/10 blur-3xl opacity-70"
              aria-hidden="true"
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28">
              <div className="max-w-3xl animate-fade-up">


                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
                  Learn the skills.
                  <br />
                  <span className="text-indigo-600">Then prove them.</span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mb-9">
                  Technical learning paths, AI-personalized study plans, and skill
                  assessments that show exactly where you stand — all before you
                  ever apply for a job.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handleCreatePlan}
                    className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all"
                  >
                    Create My Learning Plan
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </button>

                  <Link
                    href="/learning-hub/paths"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm premium-shadow hover:border-indigo-200 hover:-translate-y-0.5 transition-all"
                  >
                    <Compass className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                    Explore Learning Paths
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    No sign-in needed to browse
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    Diagnostic test optional
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    Resume anytime
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 2. Explore Paths ─────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
              <SectionHeading
                eyebrow="Explore paths"
                title="Curated roadmaps, not random playlists"
                description="Each path is an ordered sequence of modules, lessons, practice, and assessments — with prerequisites and time estimates up front."
              />
              <Link
                href="/learning-hub/paths"
                className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:gap-3 transition-all"
              >
                View all paths
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {loading && <PathCardSkeleton count={6} />}

            {error && (
              <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center premium-shadow">
                <p className="text-slate-500">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paths.map((path, i) => (
                  <PathCard key={path._id} path={path} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* ── 3. Learn With AI ─────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <SectionHeading
                  eyebrow="Learn with AI"
                  title="A roadmap built around your starting line"
                  description="The AI gathers your goal, existing skills, proficiency, and weekly hours — then generates a plan you can review and reshape before saving."
                />

                <div className="mt-8 space-y-4">
                  {[
                    ["Ask five questions", "Goal, skills, proficiency, outcome, and available time."],
                    ["Optional diagnostic", "Verify prerequisites — or skip it and continue."],
                    ["Review before saving", "Rename, retime, add topics, regenerate sections."],
                    ["Assistant per lesson", "Clarify concepts using your lesson as context."],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 premium-shadow"
                    >
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{title}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample roadmap */}
              <div className="relative bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-7 sm:p-10 text-white overflow-hidden premium-shadow">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/20 to-transparent" aria-hidden="true" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                      <BrainCircuit className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                        Sample roadmap
                      </p>
                      <p className="font-bold">React in 8 weeks · 2 hrs/day</p>
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    {[
                      ["Week 1", "JavaScript Preparation", "ES6+, promises, async/await"],
                      ["Week 2", "React Fundamentals", "JSX, components, props"],
                      ["Week 4", "React Hooks", "useEffect, custom hooks"],
                      ["Week 6", "Architecture", "Routing, Context API"],
                      ["Week 8", "Evaluation", "Final assessment"],
                    ].map(([week, mod, topics], i) => (
                      <div
                        key={week}
                        className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10"
                        style={{ opacity: 1 - i * 0.08 }}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-lg shrink-0">
                          {week}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{mod}</p>
                          <p className="text-xs text-slate-400 truncate">{topics}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-6 text-[11px] text-slate-500 leading-relaxed">
                    Illustrative example — not a guaranteed outcome.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── 4. Skill Assessment ──────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <SectionHeading
              eyebrow="Skill assessment"
              title="Three question formats, graded honestly"
              description="Objective answers are scored on the server — answer keys never reach your browser. Short answers are graded against a rubric and labeled when AI-assisted."
              align="center"
            />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {FORMATS.map((fmt, i) => (
                <div
                  key={fmt.label}
                  className="bg-white border border-slate-100 rounded-3xl p-7 premium-shadow card-hover reveal"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className="inline-block text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full mb-5">
                    {fmt.label}
                  </span>
                  <p className="text-sm text-slate-500 leading-relaxed mb-5">{fmt.desc}</p>

                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Example
                    </p>
                    <p className="text-sm text-slate-700 font-medium break-words">{fmt.example}</p>

                    {fmt.options ? (
                      <ul className="mt-3 space-y-1.5">
                        {fmt.options.map((opt, oi) => (
                          <li
                            key={opt}
                            className={`text-xs px-3 py-1.5 rounded-lg border ${
                              oi === fmt.answer
                                ? "bg-emerald-50 border-emerald-100 text-emerald-700 font-semibold"
                                : "bg-white border-slate-100 text-slate-500"
                            }`}
                          >
                            {opt}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500 font-medium">{fmt.answer}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/learning-hub/assessments"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm premium-shadow hover:border-indigo-200 hover:-translate-y-0.5 transition-all"
              >
                Browse assessment types
                <ArrowRight className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* ── 5. How It Works ──────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <SectionHeading
              eyebrow="How it works"
              title="Explore → Set Goals → Generate → Learn → Assess → Improve"
              description="A closed loop: every assessment result feeds the next set of lessons."
              align="center"
            />

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="relative bg-white border border-slate-100 rounded-3xl p-6 premium-shadow card-hover reveal"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-black text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 6. Benefits + CTA ────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-indigo-600 to-violet-600 text-white premium-shadow">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-16 items-center">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-5">
                    Start learning while
                    <br /> you&apos;re still exploring.
                  </h2>
                  <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-lg mb-8">
                    Create a free account to generate a personalized plan, study
                    in-app lessons, and keep your assessment history private to you.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleCreatePlan}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-indigo-700 font-bold text-sm hover:bg-slate-100 hover:-translate-y-0.5 transition-all"
                    >
                      Create My Learning Plan
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white/10 border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-all"
                    >
                      Sign up free
                    </Link>
                  </div>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-3 text-sm text-white/90 leading-snug"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" aria-hidden="true" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── Trust note ───────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <RefreshCcw className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden="true" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-700">Practice stays practice.</span>{" "}
                Learning Hub assessments are private to your account and are kept
                separate from formal recruitment assessments — practice scores are
                never presented as verified hiring credentials.
              </p>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-auto">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                10-min micro-assessments
              </span>
            </div>
          </section>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
