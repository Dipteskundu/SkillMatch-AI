"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useRouter } from "next/navigation";
import { MessageCircle, AlertTriangle, ArrowRight, ChevronLeft, Users, BookOpen, CheckCircle2 } from "lucide-react";

export default function CommunicationIntroPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16 flex flex-col">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm mb-10 transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm">✓</div>
            <span className="text-sm font-bold text-emerald-600">Skill Verified</span>
          </div>
          <div className="h-px w-12 bg-indigo-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm">2</div>
            <span className="text-sm font-bold text-indigo-700">Communication Test</span>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-violet-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Communication Verification Test
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            You have passed the Skill Verification. 🎉 <br />
            One final step — verify your professional communication readiness before applying.
          </p>
        </div>

        <div className="space-y-5 mb-12">
          {/* Why it matters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-7 shadow-sm">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" /> Why do we require this?
            </h2>
            <ul className="space-y-3">
              {[
                "Technical skill is important, but teamwork and communication matter equally",
                "Recruiters value candidates who can communicate professionally",
                "This test checks basic English understanding and workplace communication",
                "You earn a ✔ Communication Verified badge on your profile",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-0.5 w-5 h-5 bg-violet-50 rounded-full flex items-center justify-center shrink-0">
                    <BookOpen className="w-3 h-3 text-violet-500" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* If not completed */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-7">
            <h2 className="text-base font-black text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> If you skip this test
            </h2>
            <ul className="space-y-3">
              {[
                "You cannot complete your job application",
                "Recruiters will not know your communication readiness",
                "Your profile will not receive the Communication Verified badge",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-amber-800">
                  <span className="mt-0.5 w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center shrink-0 text-amber-600 font-black text-xs">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* After passing */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-7">
            <h2 className="text-base font-black text-emerald-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> After passing
            </h2>
            <ul className="space-y-3">
              {[
                "Your communication readiness will be permanently recorded",
                "You receive a ✔ Communication Verified badge on your profile",
                "You can now apply to any job on SkillMatch AI",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-emerald-800">
                  <span className="mt-0.5 w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 text-emerald-600 font-black text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Test details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-7 shadow-sm grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Question Types", val: "5 Questions" },
              { label: "What's Tested", val: "Communication" },
              { label: "Time Limit", val: "12 Minutes" },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-xl font-black text-violet-600">{val}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pass mark info */}
        <p className="text-center text-slate-400 text-xs mb-6">
          Pass mark: <strong className="text-slate-700">60%</strong> · If you fail, you can retry after 2 hours
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/verification/communication-test"
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-violet-200 transition-all active:scale-95"
          >
            Start Communication Test <ArrowRight className="w-5 h-5" />
          </Link>
          <button
            onClick={() => router.back()}
            className="px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
