"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, CheckCircle, ArrowRight, XCircle, Zap, Target, GraduationCap, MessageCircle, Loader2 } from "lucide-react";
import { API_BASE } from "../../lib/apiClient";
import { breakdownRows, normalizeAdjacentSkills } from "../../lib/scoreDisplay";
import { useMatchLearningPathsMutation } from "../../store/api/apiSlice";

// ── Score Ring (CSS-only circular progress) ──────────────────
function ScoreRing({ score }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, score ?? 0));
    const strokeDash = ((clamped / 100) * circumference).toFixed(1);
    const color =
        clamped >= 75 ? "#10b981" : clamped >= 50 ? "#6366f1" : "#f59e0b";

    return (
        <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
            <svg className="absolute inset-0 -rotate-90" width="144" height="144" aria-hidden="true">
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
                <span className="text-4xl font-black text-slate-900 leading-none">{score ?? "–"}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Match</span>
            </div>
        </div>
    );
}

// ── Breakdown bar per scoring factor ────────────────────────
function FactorBar({ row }) {
    if (!row.assessed) {
        return (
            <li className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-xs font-semibold text-slate-400">{row.label}</span>
                <span className="text-[11px] font-medium text-slate-400 italic shrink-0">
                    Not required / not assessed
                </span>
            </li>
        );
    }
    return (
        <li>
            <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                <span className="font-bold text-slate-700">
                    {row.label} <span className="font-semibold text-slate-400">· {row.weight}%</span>
                </span>
                <span className="font-black text-slate-900">{row.score}</span>
            </div>
            <div
                className="h-1.5 bg-slate-100 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={row.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${row.label}: ${row.score} out of 100, weighted ${row.weight}%`}
            >
                <div
                    className={`h-full rounded-full transition-all duration-700 ${row.score >= 75 ? "bg-emerald-500" : row.score >= 50 ? "bg-indigo-500" : "bg-amber-400"}`}
                    style={{ width: `${row.score}%` }}
                />
            </div>
        </li>
    );
}

// ── Skill Pill ───────────────────────────────────────────────
function SkillPill({ skill, type, note }) {
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
    const pill = (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${styles[type]}`}
        >
            {icons[type]}
            {skill}
            {note && (
                <span className="font-semibold opacity-70">({note})</span>
            )}
        </span>
    );
    if (type === "adjacent" && note) {
        return (
            <span title={`Related skill — ${note} partial credit`} className="inline-block">
                {pill}
            </span>
        );
    }
    return pill;
}

// ── Section ──────────────────────────────────────────────────
function SkillSection({ title, children, count, icon }) {
    if (!count) return null;
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">{title}</h4>
                <span className="ml-auto text-xs font-bold text-slate-400">{count}</span>
            </div>
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    );
}

// ── Gap → learning-path CTA (SkillForge loop) ─────────────────
// Asks the learning backend which published paths cover the missing skills
// and renders them inline. Honest fallback: no matches / old backend /
// signed-out → the generic link to the public /learn catalog.
function MatchedPathsCta({ missingSkills }) {
    const [triggerMatchPaths, matchState] = useMatchLearningPathsMutation();

    useEffect(() => {
        if (Array.isArray(missingSkills) && missingSkills.length > 0) {
            triggerMatchPaths(missingSkills);
        }
    }, [missingSkills, triggerMatchPaths]);

    const loading = matchState.isLoading;
    const matches = Array.isArray(matchState.data?.data?.matches)
        ? matchState.data.data.matches.filter((m) => m && typeof m === "object" && m.pathId)
        : [];
    // De-dupe by path — the same path can cover several missing skills.
    const seen = new Set();
    const uniqueMatches = matches.filter((m) => {
        if (seen.has(m.pathId)) return false;
        seen.add(m.pathId);
        return true;
    });

    if (loading) {
        return (
            <p className="flex items-center gap-2 text-xs font-bold text-indigo-500" aria-live="polite">
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                Finding learning paths for your missing skills…
            </p>
        );
    }

    if (uniqueMatches.length === 0) {
        // No tailored match (or the learning backend isn't live yet) — keep
        // the generic, honest link to the public catalog.
        return (
            <Link
                href="/learn"
                className="flex items-center justify-between gap-3 w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-sm font-bold text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
                <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Browse the Learning Hub
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
        );
    }

    return (
        <ul className="space-y-2">
            {uniqueMatches.map((match) => (
                <li key={match.pathId}>
                    <Link
                        href={`/learn/${match.pathId}`}
                        className="flex items-center justify-between gap-3 w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-sm font-bold text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        <span className="flex items-center gap-2 min-w-0">
                            <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">
                                Close this gap — {match.title}
                                {typeof match.hours === "number" ? ` · ~${match.hours}h` : ""}
                            </span>
                        </span>
                        <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}

// ── Main Modal ───────────────────────────────────────────────
export default function FitMapModal({ job, uid, onClose, onApply }) {
    const [fitData, setFitData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const panelRef = useRef(null);

    const apiBase = API_BASE;

    useEffect(() => {
        if (!job?._id || !uid) return;

        async function fetchFit() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/jobs/${job._id}/fit?uid=${uid}`);
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

    // Move focus into the dialog and close on Escape.
    useEffect(() => {
        panelRef.current?.focus();
        function onKey(e) {
            if (e.key === "Escape") onClose?.();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // New shape carries a full `score` object; legacy only has matchScore.
    const score = fitData?.score && typeof fitData.score === "object" ? fitData.score : null;
    const total = score && typeof score.total === "number" ? score.total : fitData?.matchScore ?? null;
    const rows = breakdownRows(score);
    const evidence = Array.isArray(score?.evidence) ? score.evidence : [];
    const matchedSkills = score?.matchedSkills ?? fitData?.directSkills ?? [];
    const missingSkills = score?.missingSkills ?? fitData?.missingSkills ?? [];
    const adjacentSkills = normalizeAdjacentSkills(score?.adjacentSkills ?? fitData?.adjacentSkills);
    const noAssessment = Boolean(score?.noAssessment);

    const scoreColor =
        total >= 75
            ? "text-emerald-600"
            : total >= 50
                ? "text-indigo-600"
                : "text-amber-500";

    const scoreLabel =
        total >= 75
            ? "Strong Match"
            : total >= 50
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
            <div
                ref={panelRef}
                tabIndex={-1}
                className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 focus:outline-none"
            >

                {/* Header */}
                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-7 text-white relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        aria-label="Close"
                    >
                        <X className="w-[18px] h-[18px]" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                        <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">Fit Map</span>
                    </div>
                    <h2 className="text-xl font-black leading-tight mb-0.5 pr-10">{job?.title}</h2>
                    <p className="text-slate-400 text-sm font-medium">{job?.company}</p>
                    {/* decorative blob */}
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Body */}
                <div className="p-7 max-h-[70vh] overflow-y-auto">
                    {loading && (
                        <div className="space-y-5">
                            <div className="w-36 h-36 rounded-full bg-slate-100 animate-pulse mx-auto" />
                            <div className="h-4 bg-slate-100 rounded-xl animate-pulse w-3/4 mx-auto" />
                            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-8 text-slate-500">
                            <XCircle className="w-10 h-10 text-red-300 mx-auto mb-3" aria-hidden="true" />
                            <p className="font-semibold">{error}</p>
                        </div>
                    )}

                    {!loading && fitData && (
                        <div className="space-y-6">
                            {/* Score Ring */}
                            <div className="text-center">
                                <ScoreRing score={total} />
                                <p className={`font-black text-lg mt-3 ${scoreColor}`}>{scoreLabel}</p>
                                <p className="text-slate-400 text-xs font-medium mt-1">
                                    Your fit for this role
                                    {!score && typeof fitData.directSkills?.length === "number" && (
                                        <> · {fitData.directSkills.length} of {fitData.totalRequired} required skills matched</>
                                    )}
                                </p>
                            </div>

                            {/* Breakdown by factor */}
                            {rows.length > 0 && (
                                <>
                                    <div className="h-px bg-slate-100" />
                                    <section aria-label="Score breakdown">
                                        <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
                                            How this score is calculated
                                        </h4>
                                        <ul role="list" className="space-y-3">
                                            {rows.map((row) => (
                                                <FactorBar key={row.factor} row={row} />
                                            ))}
                                        </ul>
                                        {score?.weights && (
                                            <p className="text-[11px] text-slate-400 mt-3">
                                                Weighted average of each factor — percentages shown are how much each
                                                factor counts toward your total.
                                            </p>
                                        )}
                                    </section>
                                </>
                            )}

                            {/* Evidence — the "why" */}
                            {evidence.length > 0 && (
                                <>
                                    <div className="h-px bg-slate-100" />
                                    <section aria-label="Score evidence">
                                        <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
                                            Why you got this score
                                        </h4>
                                        <ul role="list" className="space-y-2">
                                            {evidence.map((item, i) => (
                                                <li
                                                    key={`${item.factor}-${i}`}
                                                    className="flex items-start gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" aria-hidden="true" />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{item.detail}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </>
                            )}

                            {/* Skill Sections */}
                            <div className="h-px bg-slate-100" />
                            <div className="space-y-5">
                                <SkillSection
                                    title="Matched Skills"
                                    count={matchedSkills.length}
                                    icon={<CheckCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" />}
                                >
                                    {matchedSkills.map((s) => (
                                        <SkillPill key={s} skill={s} type="direct" />
                                    ))}
                                </SkillSection>
                                <SkillSection
                                    title="Related Skills"
                                    count={adjacentSkills.length}
                                    icon={<ArrowRight className="w-4 h-4 text-indigo-500" aria-hidden="true" />}
                                >
                                    {adjacentSkills.map((a) => (
                                        <SkillPill
                                            key={a.candidateSkill}
                                            skill={a.candidateSkill}
                                            type="adjacent"
                                            note={
                                                a.credit !== null || a.jobSkill
                                                    ? [
                                                        a.jobSkill ? `≈ ${a.jobSkill}` : null,
                                                        a.credit !== null ? `${Math.round(a.credit * 100)}% credit` : null,
                                                      ].filter(Boolean).join(" · ")
                                                    : null
                                            }
                                        />
                                    ))}
                                </SkillSection>
                                <SkillSection
                                    title="Missing Skills"
                                    count={missingSkills.length}
                                    icon={<XCircle className="w-4 h-4 text-red-400" aria-hidden="true" />}
                                >
                                    {missingSkills.map((s) => (
                                        <SkillPill key={s} skill={s} type="missing" />
                                    ))}
                                </SkillSection>
                            </div>

                            {/* Learn-loop CTA — candidate-facing view only */}
                            {onApply && (missingSkills.length > 0 || noAssessment) && (
                                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 space-y-3">
                                    <p className="text-xs font-black text-indigo-500 uppercase tracking-wider">
                                        Close the gap
                                    </p>
                                    {missingSkills.length > 0 && (
                                        <MatchedPathsCta missingSkills={missingSkills} />
                                    )}
                                    {noAssessment && (
                                        <Link
                                            href="/verification/skill-intro"
                                            className="flex items-center justify-between gap-3 w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-sm font-bold text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        >
                                            <span className="flex items-center gap-2">
                                                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                                Take a skill assessment to prove your abilities
                                            </span>
                                            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* CTA — Apply only makes sense for the candidate's own view */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className={`py-3.5 rounded-2xl font-black transition-all text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${onApply ? "flex-1 border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50" : "w-full bg-slate-900 text-white hover:bg-slate-800"}`}
                                >
                                    {onApply ? "Keep Browsing" : "Close"}
                                </button>
                                {onApply && (
                                    <button
                                        onClick={() => { onApply(job); onClose(); }}
                                        className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    >
                                        <Target className="w-4 h-4" aria-hidden="true" />
                                        Apply Now
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
