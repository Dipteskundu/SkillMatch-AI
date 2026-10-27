"use client";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
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
import React, { useState, useEffect } from "react";
import { useAuth } from "./lib/AuthContext";

/* ─── Static data ──────────────────────────────────────────────────────── */
const HOW_STEPS = [
  {
    num: "01",
    icon: <Search className="w-5 h-5" />,
    title: "Post a Role",
    desc: "Define the skills that matter — not just job titles. Candidates browse roles and see exactly what each one requires.",
  },
  {
    num: "02",
    icon: <Brain className="w-5 h-5" />,
    title: "Assess Candidates",
    desc: "Candidates complete structured skill assessments, and their verified results are saved to their profile.",
  },
  {
    num: "03",
    icon: <Target className="w-5 h-5" />,
    title: "Hire with Confidence",
    desc: "Review ranked matches with explainable match scores and a clear skill-gap report for every application.",
  },
];

const FEATURES = [
  {
    id: "screening",
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Skill-First Screening",
    desc: "Evaluate candidates on demonstrated skills and assessment results — not just keywords on a résumé.",
    accent: "bg-blue-50",
    iconColor: "text-blue-600",
    large: true,
  },
  {
    id: "assessments",
    icon: <ClipboardCheck className="w-6 h-6" />,
    title: "Skill Assessments",
    desc: "Structured skill tests help candidates prove what they can do before the interview.",
    accent: "bg-violet-50",
    iconColor: "text-violet-600",
    large: false,
  },
  {
    id: "resume",
    icon: <FileText className="w-6 h-6" />,
    title: "Résumé Skill Extraction",
    desc: "Upload your résumé and we extract your skills automatically to match you against open roles.",
    accent: "bg-indigo-50",
    iconColor: "text-indigo-600",
    large: false,
  },
  {
    id: "gap",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Skill Gap Detection",
    desc: "See exactly where a candidate falls short of a role's requirements — with suggestions on how to close the gap.",
    accent: "bg-emerald-50",
    iconColor: "text-emerald-600",
    large: false,
  },
  {
    id: "matching",
    icon: <Zap className="w-6 h-6" />,
    title: "Matching Engine",
    desc: "Our matching engine ranks candidates by demonstrated ability and explains every match score — so you always know why.",
    accent: "bg-amber-50",
    iconColor: "text-amber-600",
    large: true,
  },
];

/* ─── Component ────────────────────────────────────────────────────────── */
export default function Home() {
  /* Welcome Popup */
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeLeaving, setWelcomeLeaving] = useState(false);
  const { user } = useAuth();

  const displayName = user?.displayName
    ? user.displayName.split(" ")[0]
    : user?.email?.split("@")[0] ?? "there";

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
              SkillMatch AI validates real abilities through structured assessments,
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

            {/* Honest tagline micro-text */}
            <p
              className={`mt-5 text-xs text-slate-400 transition-all duration-700 delay-400 ${heroVisible ? "opacity-100" : "opacity-0"}`}
            >
              AI-powered skill matching for candidates and recruiters
            </p>

            {/* Floating UI Cards */}
            <div
              className={`relative mx-auto mt-14 max-w-3xl transition-all duration-1000 delay-500 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              {/* Central dashboard mockup — decorative illustration of product features */}
              <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <span className="w-3 h-3 rounded-full bg-red-300" />
                  <span className="w-3 h-3 rounded-full bg-amber-300" />
                  <span className="w-3 h-3 rounded-full bg-emerald-300" />
                  <span className="ml-4 text-xs text-slate-400 font-mono">SkillMatch AI / dashboard</span>
                </div>
                {/* Dashboard content */}
                <div className="p-5 grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-indigo-50/60 rounded-xl p-4 border border-indigo-100/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Skill Breakdown</p>
                    <div className="space-y-2">
                      {[
                        { name: "React", width: "85%" },
                        { name: "TypeScript", width: "70%" },
                        { name: "System Design", width: "55%" },
                      ].map((s) => (
                        <div key={s.name} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-[11px] font-semibold text-slate-700">{s.name}</span>
                              <span className="text-[10px] font-bold text-slate-400">Assessed</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full" style={{ width: s.width }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[9px] uppercase tracking-widest font-black text-emerald-500">Verified Skills</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                      <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-[9px] uppercase tracking-widest font-black text-blue-500">Ranked Matches</p>
                    </div>
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                      <TrendingUp className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                      <p className="text-[9px] uppercase tracking-widest font-black text-violet-500">Skill Gap Report</p>
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
                    <p className="text-xs font-black text-slate-800">Assessment complete</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -right-4 sm:-right-8 animate-float-gentle" style={{ animationDelay: "1.5s" }}>
                <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping-slow" />
                  </div>
                  <p className="text-xs font-black text-slate-800">New match found</p>
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
            2. HOW IT WORKS
        ══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Process</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Three steps to smarter hiring</h2>
              <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
                From job post to skill-verified candidate, in one structured flow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector line on desktop */}
              <div className="hidden md:block absolute top-12 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-[2px] bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />

              {HOW_STEPS.map((step) => (
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
            3. FEATURES — BENTO GRID
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-slate-50/70">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-3">Capabilities</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Everything you need to hire smarter</h2>
              <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
                Job posting, skill assessments, explainable matches and skill-gap reports — all in one place.
              </p>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto">
              {/* Skill-First Screening — large (col-span-2) */}
              <FeatureCard f={FEATURES[0]} className="sm:col-span-2" />
              {/* Assessments — normal */}
              <FeatureCard f={FEATURES[1]} />
              {/* Résumé extraction — normal */}
              <FeatureCard f={FEATURES[2]} />
              {/* Skill Gap — normal */}
              <FeatureCard f={FEATURES[3]} />
              {/* Matching Engine — large (col-span-2) */}
              <FeatureCard f={FEATURES[4]} className="sm:col-span-2" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. INSIGHT CTA PANEL
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
                  Get a clear view of your pipeline with match scores, skill-gap
                  reports and assessment results that explain hiring decisions — not just rank them.
                </p>
                <ul className="mt-7 space-y-3">
                  {["Automated candidate ranking", "Skill-gap analysis per application", "Interview scheduling", "Assessment results on every profile"].map((item) => (
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

              {/* Dashboard mockup — decorative illustration */}
              <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-3 text-[10px] text-slate-400 font-mono">Analytics preview</span>
                </div>
                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Pipeline stages */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Applicants", Icon: Users, color: "text-indigo-600 bg-indigo-50" },
                      { label: "Shortlisted", Icon: Star, color: "text-emerald-600 bg-emerald-50" },
                      { label: "Interviews", Icon: ClipboardCheck, color: "text-blue-600 bg-blue-50" },
                    ].map((m) => (
                      <div key={m.label} className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-md mb-1 ${m.color}`}>
                          <m.Icon className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-[9px] uppercase tracking-wide text-slate-400 font-bold">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Skill bars */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Skill Coverage</p>
                    {["TypeScript", "System Design", "API Architecture"].map((skill) => (
                      <div key={skill}>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>{skill}</span><span className="text-slate-400">Assessed</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: "70%" }} />
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
            5. FINAL CTA BANNER
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
                  <Users className="w-3.5 h-3.5" /> For candidates and recruiters
                </div>
                <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                  Ready to build a skill-first team?
                </h2>
                <p className="text-indigo-200 text-sm sm:text-base mt-3 max-w-lg mx-auto">
                  Post a role, invite candidates to prove their skills, and hire with verified evidence — all in one platform.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-8 py-3.5 rounded-full font-black text-sm shadow-lg shadow-black/10 hover:bg-indigo-50 transition-colors"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-800/60 border border-indigo-500/50 text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-indigo-800 transition-colors"
                  >
                    Contact us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
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
