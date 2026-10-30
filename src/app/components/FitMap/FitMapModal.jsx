"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, ArrowRight, XCircle, Zap, Target } from "lucide-react";
import { API_BASE, apiFetch } from "../../lib/apiClient";

// ── Score Ring (CSS-only circular progress) ──────────────────
function ScoreRing({ score }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = ((score / 100) * circumference).toFixed(1);
    const color =
        score >= 75 ? "#10b981" : score >= 50 ? "#6366f1" : "#f59e0b";

    return (
        <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
            <svg className="absolute inset-0 -rotate-90" width="144" height="144">
                {/* Track */}
                <circle cx="72" cy="72" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                {/* Progress */}
                <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
            </svg>
            <div className="flex flex-col items-center z-10">
                <span className="text-4xl font-black text-slate-900 leading-none">{score}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Match</span>
            </div>
        </div>
    );
}

// ── Skill Pill ───────────────────────────────────────────────
function SkillPill({ skill, type }) {
    const styles = {
        direct: "bg-emerald-50 text-emerald-700 border-emerald-200",
        adjacent: "bg-indigo-50 text-indigo-700 border-indigo-200",
        missing: "bg-red-50 text-red-600 border-red-200",
    };
    const icons = {
        direct: <CheckCircle className="w-3.5 h-3.5 shrink-0" />,
        adjacent: <ArrowRight className="w-3.5 h-3.5 shrink-0" />,
        missing: <XCircle className="w-3.5 h-3.5 shrink-0" />,
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${styles[type]}`}
        >
            {icons[type]}
            {skill}
        </span>
    );
}

// ── Section ──────────────────────────────────────────────────
function SkillSection({ title, skills, type, icon }) {
    if (!skills || skills.length === 0) return null;
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">{title}</h4>
                <span className="ml-auto text-xs font-bold text-slate-400">{skills.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                    <SkillPill key={s} skill={s} type={type} />
                ))}
            </div>
        </div>
    );
}

// ── Main Modal ───────────────────────────────────────────────
export default function FitMapModal({ job, uid, onClose, onApply }) {
    const [fitData, setFitData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiBase = API_BASE;

    useEffect(() => {
        if (!job?._id || !uid) return;

        async function fetchFit() {
            setLoading(true);
            setError(null);
            try {
                const res = await apiFetch(`/api/jobs/${job._id}/fit?uid=${uid}`);
                const json = await res.json();
                if (json.success) {
                    setFitData(json.data);
                } else {
                    setError("Could not calculate fit score.");
                }
            } catch {
                setError("Could not connect to server.");
            } finally {
                setLoading(false);
            }
        }

        fetchFit();
    }, [job?._id, uid, apiBase]);

    const scoreColor =
        fitData?.matchScore >= 75
            ? "text-emerald-600"
            : fitData?.matchScore >= 50
                ? "text-indigo-600"
                : "text-amber-500";

    const scoreLabel =
        fitData?.matchScore >= 75
            ? "Strong Match"
            : fitData?.matchScore >= 50
                ? "Good Fit"
                : "Partial Match";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog" aria-modal="true" aria-label="Job Fit Map">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 text-white relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4.5 w-[18px] h-[18px]" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">Fit Map</span>
                    </div>
                    <h2 className="text-xl font-black leading-tight mb-0.5">{job?.title}</h2>
                    <p className="text-slate-400 text-sm font-medium">{job?.company}</p>
                    {/* decorative blob */}
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Body */}
                <div className="p-8">
                    {loading && (
                        <div className="space-y-5">
                            <div className="w-36 h-36 rounded-full bg-slate-100 animate-pulse mx-auto" />
                            <div className="h-4 bg-slate-100 rounded-xl animate-pulse w-3/4 mx-auto" />
                            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-8 text-slate-500">
                            <XCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
                            <p className="font-semibold">{error}</p>
                        </div>
                    )}

                    {!loading && fitData && (
                        <div className="space-y-7">
                            {/* Score Ring */}
                            <div className="text-center">
                                <ScoreRing score={fitData.matchScore} />
                                <p className={`font-black text-lg mt-3 ${scoreColor}`}>{scoreLabel}</p>
                                <p className="text-slate-400 text-xs font-medium mt-1">
                                    {fitData.directSkills?.length} of {fitData.totalRequired} required skills matched
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-slate-100" />

                            {/* Skill Sections */}
                            <div className="space-y-5">
                                <SkillSection
                                    title="Direct Match"
                                    skills={fitData.directSkills}
                                    type="direct"
                                    icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                                />
                                <SkillSection
                                    title="Adjacent Skills"
                                    skills={fitData.adjacentSkills}
                                    type="adjacent"
                                    icon={<ArrowRight className="w-4 h-4 text-indigo-500" />}
                                />
                                <SkillSection
                                    title="Missing Skills"
                                    skills={fitData.missingSkills}
                                    type="missing"
                                    icon={<XCircle className="w-4 h-4 text-red-400" />}
                                />
                            </div>

                            {/* CTA */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3.5 border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm"
                                >
                                    Keep Browsing
                                </button>
                                <button
                                    onClick={() => { onApply(job); onClose(); }}
                                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                                >
                                    <Target className="w-4 h-4" />
                                    Apply Now
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
