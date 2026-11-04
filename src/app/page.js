"use client";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  PartyPopper,
  Search,
  ShieldCheck,
  Sparkles,
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

  /* Scroll-reveal helper */
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);

  const scrollDown = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

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

        {/* ══════════════════════════════════════════════════════════════
            1. HERO
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 overflow-hidden">
          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="animate-blob absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-indigo-100/60 blur-3xl" />
            <div className="animate-blob-delayed absolute -bottom-40 -right-24 w-[500px] h-[500px] rounded-full bg-violet-100/50 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-50/80 to-transparent" />
          </div>

          <div className="relative max-w-6xl mx-auto px-6 text-center -mt-10">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold tracking-wide mb-4 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              AI-Powered Skill Verification Platform
            </div>

            {/* Headline */}
            <h1
              className={`text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.03] transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              Hire for{" "}
              <span className="relative inline-block">
                <span className="shimmer-text">proven skills</span>
              </span>
              ,{" "}
              <br className="hidden sm:block" />
              not just résumés.
            </h1>

            {/* Subheading */}
            <p
              className={`text-slate-500 mt-4 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              JobMatch AI validates real abilities through structured assessments,
              then matches candidates by <strong className="text-slate-700 font-semibold">demonstrated performance</strong> — not keywords.
            </p>

            {/* CTAs */}
            <div
              className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              <Link
                href="/signup"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-full font-bold text-sm sm:text-base shadow-lg shadow-indigo-200/70 hover:bg-indigo-700 hover:shadow-indigo-300/80 transition-all duration-200"
              >
                Start Hiring Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-8 py-3.5 rounded-full font-bold text-sm sm:text-base border-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-200"
              >
                Browse Jobs
              </Link>

            </div>

            {/* Social proof micro-text */}
            <p
              className={`mt-5 text-xs text-slate-400 transition-all duration-700 delay-400 ${heroVisible ? "opacity-100" : "opacity-0"}`}
            >
              Trusted by <strong className="text-slate-600">200+</strong> fast-growing tech teams · No credit card required
            </p>

            {/* Floating UI Cards */}
            <div
              className={`relative mx-auto mt-14 max-w-3xl transition-all duration-1000 delay-500 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              {/* Central dashboard mockup */}
              <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <span className="w-3 h-3 rounded-full bg-red-300" />
                  <span className="w-3 h-3 rounded-full bg-amber-300" />
                  <span className="w-3 h-3 rounded-full bg-emerald-300" />
                  <span className="ml-4 text-xs text-slate-400 font-mono">skillmatch.ai / dashboard</span>
                </div>
                {/* Dashboard content */}
                <div className="p-5 grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-indigo-50/60 rounded-xl p-4 border border-indigo-100/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Candidate Pipeline</p>
                    <div className="space-y-2">
                      {[
                        { name: "Alex Rivera", score: 94, color: "bg-emerald-400" },
                        { name: "Sam Carter", score: 87, color: "bg-blue-400" },
                        { name: "Jordan Kim",  score: 82, color: "bg-violet-400" },
                      ].map((c) => (
                        <div key={c.name} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center">{c.name.split(" ").map(n => n[0]).join("")}</div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-[11px] font-semibold text-slate-700">{c.name}</span>
                              <span className="text-[11px] font-black text-slate-900">{c.score}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.score}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-emerald-600">92%</p>
                      <p className="text-[9px] uppercase tracking-widest font-black text-emerald-400">Retention</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-blue-600">4×</p>
                      <p className="text-[9px] uppercase tracking-widest font-black text-blue-400">Faster</p>
                    </div>
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-violet-600">98%</p>
                      <p className="text-[9px] uppercase tracking-widest font-black text-violet-400">Accuracy</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating chips */}
              <div className="absolute -top-3 -left-4 sm:-left-8 animate-float-gentle">
                <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-3 h-3" />
                  </span>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SKILL VERIFIED</p>
                    <p className="text-xs font-black text-slate-800">Advanced React.js</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -right-4 sm:-right-8 animate-float-gentle" style={{ animationDelay: "1.5s" }}>
                <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping-slow" />
                  </div>
                  <p className="text-xs font-black text-slate-800">New Match <span className="text-indigo-600">94%</span></p>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <button
              onClick={scrollDown}
              className={`mt-12 flex flex-col items-center gap-1 mx-auto text-slate-300 hover:text-indigo-400 transition-colors duration-700 delay-700 ${heroVisible ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-xs font-medium">Explore</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            2. TRUSTED BY – MARQUEE STRIP
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-10 border-y border-slate-100 bg-slate-50/60">
          <div className="max-w-6xl mx-auto px-6 text-center mb-5">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-slate-400">Trusted by teams at</p>
          </div>
          <div className="overflow-hidden">
            <div className="flex animate-marquee gap-14 w-max">
              {PARTNERS.map((name, i) => (
                <span key={i} className="text-slate-400 font-black text-sm tracking-wide whitespace-nowrap hover:text-indigo-500 transition-colors cursor-default">
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
        <section className="py-20 sm:py-28 bg-slate-50/70">
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
              {/* AI Matching — large (col-span-2) */}
              <FeatureCard f={FEATURES[4]} className="sm:col-span-2" />
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
        <section className="py-20 sm:py-28 bg-slate-50/70">
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
            7. INSIGHT CTA PANEL
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/60 border border-slate-200/60 rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center overflow-hidden relative">
              {/* Decorative blob */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-4">Talent Intelligence</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  Insightful analytics for every hiring decision
                </h2>
                <p className="text-slate-500 text-sm sm:text-base mt-4 leading-relaxed">
                  Get a clear view of your pipeline with predictive analytics, calibrated scoring,
                  and skill heatmaps that explain hiring decisions — not just rank them.
                </p>
                <ul className="mt-7 space-y-3">
                  {["Automated candidate ranking", "Skill correlation heatmaps", "Soft-skill behavioral analysis", "Exportable PDF reports"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-8 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                >
                  See the Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Dashboard mockup */}
              <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-3 text-[10px] text-slate-400 font-mono">Analytics · Live</span>
                  <span className="ml-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-emerald-500 font-bold">Live</span>
                  </span>
                </div>
                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Applicants", val: "128", color: "text-indigo-600" },
                      { label: "Shortlisted", val: "24", color: "text-emerald-600" },
                      { label: "Avg Score", val: "87%", color: "text-blue-600" },
                    ].map((m) => (
                      <div key={m.label} className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                        <p className={`text-base font-black ${m.color}`}>{m.val}</p>
                        <p className="text-[9px] uppercase tracking-wide text-slate-400 font-bold">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Skill bars */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Skill Coverage</p>
                    {[
                      { skill: "TypeScript", pct: 88 },
                      { skill: "System Design", pct: 74 },
                      { skill: "API Architecture", pct: 61 },
                    ].map((s) => (
                      <div key={s.skill}>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>{s.skill}</span><span>{s.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            8. FINAL CTA BANNER
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
