"use client";

import { TrendingUp, BookOpen, ArrowRight, XCircle } from "lucide-react";
import Link from "next/link";

export default function GrowthFeedbackCard({ feedback, jobTitle, company }) {
    if (!feedback || !feedback.missingSkills?.length) return null;

    return (
        <div className="theme-feedback-card border border-amber-200 rounded-[2rem] p-7 shadow-sm">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-amber-100 rounded-2xl shrink-0">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">Growth Plan</h4>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                        You were close for <strong>{jobTitle}</strong>
                        {company ? ` at ${company}` : ""}
                    </p>
                </div>
            </div>

            {/* Missing Skills */}
            <div className="mb-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    Skills to develop
                </p>
                <div className="flex flex-wrap gap-2">
                    {feedback.missingSkills.map((skill) => (
                        <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold shadow-sm"
                        >
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Suggested Actions */}
            {feedback.suggestedActions?.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                        Recommended steps
                    </p>
                    <ol className="space-y-2.5">
                        {feedback.suggestedActions.map((action, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{action}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
                {feedback.missingSkills.slice(0, 2).map((skill) => (
                    <Link
                        key={skill}
                        href={`/jobs?q=${encodeURIComponent(skill)}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-amber-300 text-amber-700 rounded-xl text-xs font-black hover:bg-amber-50 hover:border-amber-400 transition-all active:scale-95"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        Find {skill} Jobs
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
