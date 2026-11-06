"use client";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import HomeHero from "./components/Hero/HomeHero";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  PartyPopper,
  Search,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import ApplyModal from "./components/form/ApplyModal";
import { useAuth } from "./lib/AuthContext";

/* ─── Animated counter hook ───────────────────────────────────────────── */
function useCountUp(target, duration = 1800, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setCount(Math.floor(ease * target));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

/* ─── Static data ──────────────────────────────────────────────────────── */
const PARTNERS = [
  "Acme Corp",
  "Tech Innovations",
  "Data Solutions",
  "Cloud Labs",
  "Auto Systems",
  // placeholder partners
];

const HOW_STEPS = [
  {
    num: "01",
    icon: <Search className="w-5 h-5" />,
    title: "Post a Role",
    desc: "Define the skills that matter — not just job titles. Our AI auto-generates relevant assessment templates.",
  },
  {
    num: "02",
    icon: <Brain className="w-5 h-5" />,
    title: "Assess Candidates",
    desc: "Candidates complete structured skill tests. Cognitive depth, not just syntax — evaluated in real time.",
  },
  {
    num: "03",
    icon: <Target className="w-5 h-5" />,
    title: "Hire with Confidence",
    desc: "Get ranked matches backed by verified performance data, skill heatmaps, and AI-powered insights.",
  },
];

const FEATURES = [
  {
    id: "bias",
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Bias-Free Screening",
    desc: "Evaluate purely on skill signals and real performance data — fully anonymised until shortlisting.",
    accent: "bg-blue-50",
    iconColor: "text-blue-600",
    large: true,
  },
  {
    id: "pulse",
    icon: <Activity className="w-6 h-6" />,
    title: "Real-time Pulse",
    desc: "Live evaluation tracking as candidates complete each assessment module.",
    accent: "bg-violet-50",
    iconColor: "text-violet-600",
    large: false,
  },
  {
    id: "cognitive",
    icon: <Brain className="w-6 h-6" />,
    title: "Cognitive Analysis",
    desc: "Understand problem-solving depth, not just code output or buzzword frequency.",
    accent: "bg-indigo-50",
    iconColor: "text-indigo-600",
    large: false,
  },
  {
    id: "gap",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Skill Gap Detection",
    desc: "Pinpoint exactly where a candidate falls short and suggest targeted learning paths.",
    accent: "bg-emerald-50",
    iconColor: "text-emerald-600",
    large: false,
  },
  {
    id: "ai",
    icon: <Zap className="w-6 h-6" />,
    title: "AI Matching Engine",
    desc: "Our proprietary model ranks candidates by verified ability, not keyword density.",
    accent: "bg-amber-50",
    iconColor: "text-amber-600",
    large: true,
  },
  {
    id: "targeted",
    icon: <Target className="w-6 h-6" />,
    title: "Role-to-Skill Mapping",
    desc: "Define exactly what each role requires and let assessments map candidates against it.",
    accent: "bg-rose-50",
    iconColor: "text-rose-600",
    large: false,
  },
  {
    id: "pool",
    icon: <Users className="w-6 h-6" />,
    title: "Rich Talent Pool",
    desc: "Every completed assessment adds a verified profile to your searchable talent pool.",
    accent: "bg-cyan-50",
    iconColor: "text-cyan-600",
    large: false,
  },
];

const STATS = [
  { label: "Developers", value: 150, suffix: "+", display: "150+" },
  { label: "Tech Companies", value: 25, suffix: "+", display: "25+" },
  { label: "Match Accuracy", value: 85, suffix: "%", display: "85%" },
  { label: "Hours Saved", value: 8, suffix: "m", display: "8m" },
];

const TESTIMONIALS = [
  {
    name: "Jamie Williams",
    role: "Engineering Manager",
    company: "Midwest Tech",
    avatar: "JW",
    avatarBg: "bg-indigo-100 text-indigo-600",
    text: "JobMatch's skill verification helped us identify candidates with actual practical experience, reducing our screening time by 40%.",
    stars: 4,
  },
  {
    name: "Rohit Patel",
    role: "HR Director",
    company: "Global Enterprises",
    avatar: "RP",
    avatarBg: "bg-emerald-100 text-emerald-600",
    text: "The skill gap detection is spot-on. Our recruiters now have clear, actionable feedback for every applicant.",
    stars: 5,
  },
  {
    name: "Elena Torres",
    role: "Founder",
    company: "StartUp Labs",
    avatar: "ET",
    avatarBg: "bg-violet-100 text-violet-600",
    text: "As a bootstrapped founder, the free tier is perfect. We've hired 3 great developers through the platform already.",
    stars: 5,
  },
];

/* ─── Component ────────────────────────────────────────────────────────── */
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob] = useState({ title: "Senior Product Designer", company: "TechFlow AI" });

  /* Welcome Popup */
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeLeaving, setWelcomeLeaving] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {

    if (typeof window !== "undefined" && sessionStorage.getItem("showWelcome") === "1") {
      sessionStorage.removeItem("showWelcome");

      const show = setTimeout(() => setShowWelcome(true), 400);
      return () => clearTimeout(show);
    }
  }, []);

  const dismissWelcome = () => {
    setWelcomeLeaving(true);
    setTimeout(() => { setShowWelcome(false); setWelcomeLeaving(false); }, 400);
  };


  useEffect(() => {
    if (!showWelcome) return;
    const hide = setTimeout(() => dismissWelcome(), 4000);
    return () => clearTimeout(hide);
  }, [showWelcome]);


  const displayName = user?.displayName
    ? user.displayName.split(" ")[0]
    : user?.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <Navbar />

      {/* ── Welcome Back Popup ─────────────────────────────────────────── */}
      {showWelcome && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-400 ${welcomeLeaving ? "opacity-0 translate-y-4 scale-95" : "opacity-100 translate-y-0 scale-100"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)" }}
          role="status"
          aria-live="polite"
        >
          <div className="absolute bottom-0 left-0 h-[3px] bg-indigo-500/20 w-full rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-welcome-bar" />
          </div>
          <div className="flex items-center gap-4 bg-white border border-slate-100 shadow-xl shadow-slate-200/60 rounded-2xl px-5 py-4 min-w-[300px] max-w-[420px]">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <PartyPopper className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Welcome back</p>
              <p className="text-[16px] font-black text-slate-900 truncate">{displayName}!</p>
            </div>
            <button onClick={dismissWelcome} className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main>

        <HomeHero stats={STATS} />

        {/* ══════════════════════════════════════════════════════════════
            2. TRUSTED BY – MARQUEE STRIP
        ══════════════════════════════════════════════════════════════ */}
        <section className="home-trusted-section border-y border-slate-100 pt-8 pb-8">
          <div className="max-w-6xl mx-auto px-6 text-center mb-7">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-slate-400">Trusted by teams at</p>
          </div>
          <div className="relative overflow-hidden">
            {/* Edge fades — hide the entry/exit points of the marquee */}
            <div className="home-marquee-fade-left pointer-events-none absolute inset-y-0 left-0 z-10 w-24" aria-hidden="true" />
            <div className="home-marquee-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-24" aria-hidden="true" />
            <div className="flex animate-marquee gap-14 w-max">
              {[...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS].map((name, i) => (
                <span
                  key={i}
                  aria-hidden={i >= PARTNERS.length}
                  className="text-slate-400 font-black text-sm tracking-wide whitespace-nowrap hover:text-indigo-500 transition-colors cursor-default"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3. HOW IT WORKS
        ══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Process</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Three steps to smarter hiring</h2>
              <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
                From job post to verified candidate in a fraction of traditional hiring time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector line on desktop */}
              <div className="hidden md:block absolute top-12 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-[2px] bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />

              {HOW_STEPS.map((step, idx) => (
                <div key={step.num} className="card-hover relative bg-white border border-slate-100 rounded-2xl p-7 text-left hover:border-indigo-100 group">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-200 relative z-10">
                      {step.icon}
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. FEATURES — BENTO GRID
        ══════════════════════════════════════════════════════════════ */}
        <section className="home-theme-section py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Capabilities</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Everything you need to hire smarter</h2>
              <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
                Modern, measurable hiring tools designed for engineering-driven teams.
              </p>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto">
              {/* Bias-Free — large (col-span-2) */}
              <FeatureCard f={FEATURES[0]} className="sm:col-span-2" />
              {/* Pulse — normal */}
              <FeatureCard f={FEATURES[1]} />
              {/* Cognitive — normal */}
              <FeatureCard f={FEATURES[2]} />
              {/* Skill Gap — normal */}
              <FeatureCard f={FEATURES[3]} />
              {/* Role-to-Skill — normal (fills row 2) */}
              <FeatureCard f={FEATURES[5]} />
              {/* AI Matching — large (col-span-2) */}
              <FeatureCard f={FEATURES[4]} className="sm:col-span-2" />
              {/* Talent Pool — normal (fills row 3) */}
              <FeatureCard f={FEATURES[6]} />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5. STATS
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Impact</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Numbers that speak for themselves</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {STATS.map((s) => (
                <StatCard key={s.label} stat={s} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            6. TESTIMONIALS
        ══════════════════════════════════════════════════════════════ */}
        <section className="home-theme-section py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Social Proof</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Loved by hiring teams</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.name}
                  className="card-hover bg-white border border-slate-100 rounded-2xl p-7 flex flex-col"
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed flex-1">&quot;{t.text}&quot;</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full text-sm font-black flex items-center justify-center ${t.avatarBg}`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            7. HOW THE SCORE WORKS — EXPLAINABILITY
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Transparent by design</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Know exactly why candidates rank first</h2>
              <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
                Every Hiring Fit Score is an explainable 0–100 number built from five openly weighted factors — never a black-box verdict.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Factor breakdown */}
              <div className="card-hover bg-white border border-slate-200 rounded-3xl p-7 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scoring factors</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Open weights</span>
                </div>
                <div className="space-y-4">
                  {[
                    { factor: "Skill match", detail: "Required + preferred skills after normalization", weight: 45, chip: "bg-indigo-50 text-indigo-600" },
                    { factor: "Assessment performance", detail: "Role-specific, automatically scored", weight: 25, chip: "bg-violet-50 text-violet-600" },
                    { factor: "Relevant experience", detail: "Aligned with the stated experience level", weight: 15, chip: "bg-emerald-50 text-emerald-600" },
                    { factor: "Education & qualification", detail: "Only when the job defines a requirement", weight: 10, chip: "bg-amber-50 text-amber-600" },
                    { factor: "Additional role factors", detail: "Certifications and defined role criteria", weight: 5, chip: "bg-rose-50 text-rose-600" },
                  ].map((f) => (
                    <div key={f.factor}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-slate-900">{f.factor}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${f.chip}`}>{f.weight}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${(f.weight / 45) * 100}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{f.detail}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-6 leading-relaxed">
                  If a job omits a component, its weight is redistributed by a documented policy — never silently zeroed.
                </p>
              </div>

              {/* Score mock card */}
              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-3 text-[10px] text-slate-400 font-mono">Hiring Fit Score · Candidate review</span>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Senior React Developer</p>
                      <p className="text-xs text-slate-400">Ranked #1 of 24 applicants</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-indigo-600">87<span className="text-sm text-slate-400">/100</span></p>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Fit score</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { group: "Matched skills", tone: "bg-emerald-50 text-emerald-700", icon: "bg-emerald-100", check: "text-emerald-600", items: ["React.js", "TypeScript", "Node.js"] },
                      { group: "Partial matches", tone: "bg-amber-50 text-amber-700", icon: "bg-amber-100", check: "text-amber-600", items: ["Next.js", "Docker"] },
                      { group: "Missing skills", tone: "bg-slate-100 text-slate-500", icon: "bg-slate-200", check: "text-slate-500", items: ["GraphQL"] },
                    ].map((g) => (
                      <div key={g.group} className="border border-slate-100 rounded-xl p-3">
                        <p className={`text-[10px] font-black uppercase tracking-widest inline-block px-2 py-0.5 rounded-full mb-2 ${g.tone}`}>{g.group}</p>
                        <div className="flex flex-wrap gap-2">
                          {g.items.map((s) => (
                            <span key={s} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                              <CheckCircle2 className={`w-3.5 h-3.5 ${g.check}`} /> {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                    Recruiters see the same breakdown on every applicant — matched, partial, and missing skills are listed alongside the score.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            8. RESPONSIBLE AI — HUMAN IN THE LOOP
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Human in the loop</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">AI assists. Recruiters decide.</h2>
              <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
                The platform is decision support, not decision authority — every recommendation is transparent and reviewable.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: <Activity className="w-6 h-6" />, accent: "bg-indigo-50", iconColor: "text-indigo-600", title: "Decision support only", desc: "Scores and rankings assist review — nothing is auto-rejected or auto-hired." },
                { icon: <Users className="w-6 h-6" />, accent: "bg-emerald-50", iconColor: "text-emerald-600", title: "Humans make the call", desc: "Recruiters own every shortlist, interview, and hiring decision." },
                { icon: <Brain className="w-6 h-6" />, accent: "bg-violet-50", iconColor: "text-violet-600", title: "Explainable by default", desc: "Matched, partial, and missing skills are listed with every score." },
                { icon: <ShieldCheck className="w-6 h-6" />, accent: "bg-amber-50", iconColor: "text-amber-600", title: "Configurations are logged", desc: "Scoring weights and AI outputs are recorded so behavior can be audited." },
              ].map((c) => (
                <div key={c.title} className="card-hover bg-white border border-slate-100 rounded-2xl p-7 hover:border-indigo-100 group">
                  <div className={`w-11 h-11 rounded-2xl ${c.accent} flex items-center justify-center mb-5 ${c.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                    {c.icon}
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">{c.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            9. FOR CANDIDATES — SKILL GAP TO GROWTH
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">For candidates</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Turn every application into growth</h2>
              <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
                Assessments do more than prove skills — they show you exactly what to learn next.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[
                { step: "01", icon: <Users className="w-5 h-5" />, title: "Upload your resume", desc: "Skills and experience are extracted automatically — review and confirm them." },
                { step: "02", icon: <Target className="w-5 h-5" />, title: "Take the assessment", desc: "Role-specific tests verify practical ability, not buzzwords." },
                { step: "03", icon: <TrendingUp className="w-5 h-5" />, title: "See your skill gaps", desc: "Get a clear list of what is missing or weak for each target job." },
                { step: "04", icon: <Zap className="w-5 h-5" />, title: "Close the gap", desc: "Follow suggested learning paths, re-test, and rank higher next time." },
              ].map((s) => (
                <div key={s.step} className="card-hover bg-slate-50 border border-slate-100 rounded-2xl p-7 hover:border-indigo-100 group">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                      {s.icon}
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">{s.step}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            10. TRUST & SECURITY
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Trust & safety</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Built with security defaults</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                "Firebase-secured authentication",
                "Role-based access control",
                "Verified recruiter & candidate roles",
                "Data access limited by role",
                "Validated API inputs",
              ].map((chip) => (
                <span key={chip} className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> {chip}
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-6 max-w-xl mx-auto">
              Candidates control their own profile data. Recruiters only see candidate information their role requires.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            11. FINAL CTA BANNER
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-10 sm:p-16 text-center text-white overflow-hidden">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:20px_20px]" />
              {/* Orbs */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide mb-6">
                  <Users className="w-3.5 h-3.5" /> 200+ companies already onboard
                </div>
                <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                  Ready to build a skill-first team?
                </h2>
                <p className="text-indigo-200 text-sm sm:text-base mt-3 max-w-lg mx-auto">
                  Create assessments, invite candidates, and hire with verified evidence — all in one platform.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-8 py-3.5 rounded-full font-black text-sm shadow-lg shadow-black/10 hover:bg-indigo-50 transition-colors"
                  >
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/jobs"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-800/60 border border-indigo-500/50 text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-indigo-800 transition-colors"
                  >
                    Talk to Sales
                  </Link>
                </div>
                <p className="mt-5 text-indigo-300 text-xs">No credit card required · Free plan available · Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <ApplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobTitle={selectedJob.title}
        companyName={selectedJob.company}
      />
    </div>
  );
}

/* ─── Feature Card sub-component ──────────────────────────────────────── */
function FeatureCard({ f, className = "" }) {
  return (
    <div
      className={`card-hover bg-white border border-slate-100 rounded-2xl p-7 flex flex-col hover:border-indigo-100 group ${className}`}
    >
      <div className={`w-11 h-11 rounded-2xl ${f.accent} flex items-center justify-center mb-5 ${f.iconColor} group-hover:scale-110 transition-transform duration-200`}>
        {f.icon}
      </div>
      <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">{f.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
    </div>
  );
}

/* ─── Stat Card sub-component ─────────────────────────────────────────── */
function StatCard({ stat }) {
  const { count, ref } = useCountUp(stat.value);
  const isPercent = stat.suffix === "%";
  const isSuffix  = stat.suffix !== "%";

  return (
    <div ref={ref} className="card-hover bg-white border border-slate-100 rounded-2xl py-8 px-4 text-center hover:border-indigo-100">
      <div className="text-3xl sm:text-4xl font-black text-slate-900">
        <span className="shimmer-text">
          {count}{stat.suffix}
        </span>
      </div>
      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mt-2">
        {stat.label}
      </div>
    </div>
  );
}
