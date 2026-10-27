"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle, Star, ArrowRight, ChevronLeft } from "lucide-react";

export default function SkillIntroPage() {
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

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Skill Verification Test
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Before you can apply for jobs, JobMatch AI requires a one-time skill verification to ensure every candidate is judged by <strong className="text-slate-800">real ability</strong>, not just profile claims.
          </p>
        </div>

        <div className="space-y-5 mb-12">
          {/* Why it matters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-7 shadow-sm">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" /> Why is this required?
            </h2>
            <ul className="space-y-3">
              {[
                "Prove your technical skills to recruiters with verified evidence",
                "Build trust and stand out from unverified candidates",
                "Show verified skills directly on your profile to recruiters",
                "Earn a Skill Verified badge on your profile",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-0.5 w-5 h-5 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                    <Star className="w-3 h-3 text-indigo-500" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* What if skipped */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-7">
            <h2 className="text-base font-black text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> If you skip this test
            </h2>
            <ul className="space-y-3">
              {[
                "You cannot apply for any job on JobMatch AI",
                "Recruiters will not see your profile as verified",
                "Your profile will not receive the Skill Verified Badge",
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
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> After passing
            </h2>
            <ul className="space-y-3">
              {[
                "You receive a ✔ Verified Skill Badge on your profile",
                "Your result is saved to your profile",
                "You move to the Communication Verification test",
                "After both tests pass, you can apply to any job",
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
              { label: "Skills Tested", val: "Top 3 Skills" },
              { label: "Questions", val: "9 Questions" },
              { label: "Time Limit", val: "10 Minutes" },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-xl font-black text-indigo-600">{val}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pass mark info */}
        <p className="text-center text-slate-400 text-xs mb-6">
          Pass mark: <strong className="text-slate-700">60%</strong> · If you fail, you can retry after 2 hours · No penalties for skipping
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/skill-test"
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95"
          >
            Start Skill Test <ArrowRight className="w-5 h-5" />
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
