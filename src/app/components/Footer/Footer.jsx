"use client";

import Link from "next/link";
import { Rocket, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                SkillMatch<span className="text-indigo-600">AI</span>
              </span>
            </Link>
            <p className="text-slate-500 text-[15px] leading-relaxed max-w-xs">
              Empowering the next generation of talent through AI-powered skill matching and career acceleration.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold mb-6">For Candidates</h4>
            <ul className="space-y-4">
              {[
                { name: "Browse Jobs", href: "/jobs" },
                { name: "Skill Assessments", href: "/verification/skill-intro" },
                { name: "About Us", href: "/about" }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-500 hover:text-indigo-600 text-[15px] transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold mb-6">For Employers</h4>
            <ul className="space-y-4">
              {[
                { name: "Post a Job", href: "/post-job" },
                { name: "Talent Search", href: "/jobs" },
                { name: "Browse Applicants", href: "/applicants" }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-500 hover:text-indigo-600 text-[15px] transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold mb-6">Contact</h4>
            <p className="text-slate-500 text-[15px] mb-6">
              Questions, feedback or partnership ideas? We&apos;re here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              Contact us
            </Link>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm" suppressHydrationWarning>
            © {new Date().getFullYear()} SkillMatch AI. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link href="/privacy" className="text-slate-400 hover:text-slate-600 text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-400 hover:text-slate-600 text-sm">Terms of Service</Link>
            <Link href="/cookies" className="text-slate-400 hover:text-slate-600 text-sm">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
