"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import api from "../lib/apiClient";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    ListChecks,
    Send,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Target,
    X,
} from "lucide-react";
import {
    TIME_LIMIT_SECONDS,
    answeredCount,
    formatCountdown,
    formatRetryIn,
    isAnswered,
    progressPercent,
    timerTone,
} from "./testHelpers";

// Skill Verification Test — mobile-first, one question per view.
//
// Flow: selection → intro (framing) → testing (progress + countdown +
// per-question navigation) → review/confirm → result.
// The server owns the answer key, the 10-minute limit, and the 2h fail
// cooldown; the countdown is seeded from the server's remainingSec and the
// page never fakes success on errors (expired → honest restart, cooldown →
// honest wait message).

export default function SkillTestPage() {
    const { user, userProfile, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const [pageStatus, setPageStatus] = useState("loading"); // loading, selection, intro, generating, testing, review, submitting, result, expired, error, verified
    const [errorMsg, setErrorMsg] = useState("");
    const [warnMsg, setWarnMsg] = useState("");

    const [unverifiedSkills, setUnverifiedSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);

    const [testData, setTestData] = useState(null); // { testId, skills, questions, remainingSec, ... }
    const [answers, setAnswers] = useState({}); // { questionId: optionIndex }
    const [currentQ, setCurrentQ] = useState(0);
    const [confirmSubmit, setConfirmSubmit] = useState(false);

    // Timer — seeded from the server's remaining time (server enforces it too).
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);

    const [resultData, setResultData] = useState(null); // { score, result, perSkill, ... }

    // Guards so a double click / timer+click can never fire two submits.
    const submitGuardRef = useRef(false);

    const checkTestingEligibility = useCallback((p) => {
        if (!p) return;
        // Did they fail recently? Check cooldown (server also enforces it).
        if (p.nextAttemptTime) {
            const nextTime = new Date(p.nextAttemptTime);
            if (nextTime > new Date()) {
                setErrorMsg(`You did not pass your previous test. You can retake it ${formatRetryIn(nextTime)}.`);
                setPageStatus("error");
                return;
            }
        }

        const allSkills = Array.isArray(p.skills) ? p.skills : [];
        const verSkills = Array.isArray(p.verifiedSkills) ? p.verifiedSkills : [];
        const hasDeclaredSkills = allSkills.length > 0;
        const pending = allSkills.filter((s) => !verSkills.includes(s));
        const derivedSkillVerified = hasDeclaredSkills && pending.length === 0 && verSkills.length > 0;
        const effectiveSkillVerified = Boolean(p.isSkillVerified) || derivedSkillVerified;

        if (effectiveSkillVerified) {
            setPageStatus("verified"); // Already totally verified
            return;
        }

        // If no skills are declared, user cannot take the test yet.
        if (!hasDeclaredSkills) {
            setErrorMsg("Please add at least one skill in your profile before starting skill verification.");
            setPageStatus("error");
            return;
        }

        setUnverifiedSkills(pending);
        setPageStatus("selection");
    }, []);

    // Effect to check eligibility once userProfile is available
    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated) {
            router.push("/signin");
            return;
        }
        if (userProfile) {
            checkTestingEligibility(userProfile);
        } else {
            // Profile failed to load or doesn't exist yet
            setPageStatus("loading");
        }
    }, [checkTestingEligibility, isAuthenticated, loading, router, userProfile]);

    const startTestGeneration = async () => {
        if (selectedSkills.length === 0) return;
        setPageStatus("generating");
        setErrorMsg("");

        try {
            const res = await api.post("/api/skill-test/generate", {
                candidateId: user.uid,
                skills: selectedSkills,
            });
            const data = res.data;
            if (res.status === 200 && data?.success) {
                const d = data.data;
                setTestData(d);
                const initAnswers = {};
                (d.questions || []).forEach((q) => {
                    initAnswers[q.id] = null;
                });
                setAnswers(initAnswers);
                setCurrentQ(0);
                setConfirmSubmit(false);
                setWarnMsg("");
                setTimeLeft(typeof d.remainingSec === "number" ? d.remainingSec : TIME_LIMIT_SECONDS);
                submitGuardRef.current = false;
                setPageStatus("testing");
                return;
            }
            if (data?.code === "COOLDOWN") {
                setErrorMsg(`Please wait before retaking the test. You can try again ${formatRetryIn(data.nextAttemptAt)}.`);
                setPageStatus("error");
                return;
            }
            setErrorMsg(data?.message || "Failed to generate the test. Please try again.");
            setPageStatus("selection");
        } catch (err) {
            console.error(err);
            const data = err?.response?.data;
            if (data?.code === "COOLDOWN") {
                setErrorMsg(`Please wait before retaking the test. You can try again ${formatRetryIn(data.nextAttemptAt)}.`);
                setPageStatus("error");
                return;
            }
            setErrorMsg(data?.message || "Network error. Please check your connection and try again.");
            setPageStatus("selection");
        }
    };

    const handleSubmitFailure = useCallback((data, auto) => {
        if (data?.code === "TEST_EXPIRED" || data?.expired) {
            setErrorMsg(data?.message || "Time is up — this test has expired.");
            setPageStatus("expired");
            return;
        }
        setErrorMsg(
            data?.message ||
                (auto
                    ? "Time ran out and the test could not be submitted. Please start a new test."
                    : "Failed to submit the test. Please try again."),
        );
        setPageStatus("error");
    }, []);

    const handleSubmitTest = useCallback(
        async ({ auto = false } = {}) => {
            if (!testData?.testId || !user?.uid) return;
            if (submitGuardRef.current) return;
            submitGuardRef.current = true;
            setPageStatus("submitting");

            // Option indexes (0-based) — the server grades against its own
            // shuffled answer key; nothing answer-bearing ever came from it.
            const formattedAnswers = Object.entries(answers).map(([questionId, optionIndex]) => ({
                questionId,
                answer: optionIndex === null || optionIndex === undefined ? "" : String(optionIndex),
            }));

            try {
                const res = await api.post("/api/skill-test/submit", {
                    testId: testData.testId,
                    candidateId: user.uid,
                    answers: formattedAnswers,
                });
                const data = res.data;
                if (res.status === 200 && data?.success) {
                    setResultData(data.data);
                    setPageStatus("result");
                    return;
                }
                submitGuardRef.current = false; // allow an honest retry from the error screen
                handleSubmitFailure(data, auto);
            } catch (err) {
                console.error(err);
                submitGuardRef.current = false;
                handleSubmitFailure(err?.response?.data, auto);
            }
        },
        [answers, handleSubmitFailure, testData, user],
    );

    const handleSubmitTestRef = useRef(handleSubmitTest);
    useEffect(() => {
        handleSubmitTestRef.current = handleSubmitTest;
    }, [handleSubmitTest]);

    // Timer Logic — ticks once a second while testing/reviewing (the server
    // clock does not pause for the review screen); auto-submits at zero.
    const timerActive = pageStatus === "testing" || pageStatus === "review";
    useEffect(() => {
        if (!timerActive) return undefined;
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timerActive]);

    useEffect(() => {
        if (!timerActive || timeLeft > 0) return;
        // Time is up: submit whatever has been answered so far.
        handleSubmitTestRef.current({ auto: true });
    }, [timerActive, timeLeft]);

    // Anti-cheating: Tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && pageStatus === "testing") {
                setWarnMsg("Warning: Leaving the tab during the test may result in an automatic failure.");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [pageStatus]);

    const handleAnswerChange = (qId, optionIndex) => {
        setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
    };

    const questions = useMemo(() => testData?.questions ?? [], [testData]);
    const totalQuestions = questions.length;
    const answeredTotal = useMemo(() => answeredCount(answers, questions), [answers, questions]);
    const currentQuestion = questions[currentQ] ?? null;
    const unansweredTotal = totalQuestions - answeredTotal;
    const tone = timerTone(timeLeft);

    const goToQuestion = (index) => {
        setCurrentQ(Math.max(0, Math.min(index, totalQuestions - 1)));
        setPageStatus("testing");
    };

    // UI RENDERING

    if (loading || pageStatus === "loading") {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Checking Verification Status...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">

                {/* HEADINGS */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Skill Verification Test</h1>
                    <p className="text-slate-500 text-base sm:text-lg">Short, honest, and verified — prove your skills in about 10 minutes.</p>
                </div>

                {/* ERROR / VERIFIED / EXPIRED */}
                {(pageStatus === "error" || pageStatus === "verified" || pageStatus === "expired") && (
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 text-center max-w-2xl mx-auto w-full">
                        {pageStatus === "verified" ? (
                            <>
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">You are fully verified!</h2>
                                <p className="text-slate-500 mb-8">All your declared skills are verified. You can now apply to any job.</p>
                                <button onClick={() => router.push("/jobs")} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
                                    Browse Jobs
                                </button>
                            </>
                        ) : pageStatus === "expired" ? (
                            <>
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
                                    <Clock className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Time&apos;s up</h2>
                                <p className="text-slate-500 mb-3 max-w-md mx-auto">{errorMsg}</p>
                                <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
                                    Your answers were not graded and no retry penalty applies — you can start a fresh test right away.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={startTestGeneration}
                                        disabled={selectedSkills.length === 0}
                                        className={`px-8 py-4 rounded-2xl font-bold shadow-xl transition-all ${selectedSkills.length > 0 ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-transparent"}`}
                                    >
                                        Start a new test
                                    </button>
                                    <button onClick={() => setPageStatus("selection")} className="px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                        Choose different skills
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                                    <ShieldAlert className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Test Unavailable</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">{errorMsg}</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button onClick={() => setPageStatus("selection")} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all text-sm">
                                        Back to Skill Test
                                    </button>
                                    <button onClick={() => router.push("/resume")} className="px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm">
                                        Upload Resume
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* SKILL SELECTION */}
                {pageStatus === "selection" && (
                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 max-w-2xl mx-auto w-full">
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Select skills to verify</h2>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                            You have skills on your profile that are not yet verified. Select up to 3 below — you&apos;ll see a short overview before the timer starts.
                        </p>

                        <div className="space-y-3 mb-8">
                            {unverifiedSkills.map(skill => {
                                const isSelected = selectedSkills.includes(skill);
                                const isDisabled = !isSelected && selectedSkills.length >= 3;
                                return (
                                <label key={skill} className={`block p-5 border-2 rounded-2xl cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/50' : isDisabled ? 'border-slat-100 bg-slate-50 opacity-50 cursor-not-allowed' : 'border-slate-100 hover:border-indigo-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-indigo-600 focus:ring-0 rounded"
                                            name="skill"
                                            value={skill}
                                            checked={isSelected}
                                            disabled={isDisabled}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    if (selectedSkills.length < 3) setSelectedSkills([...selectedSkills, skill]);
                                                } else {
                                                    setSelectedSkills(selectedSkills.filter(s => s !== skill));
                                                }
                                            }}
                                        />
                                        <span className="font-bold text-slate-900 text-lg">{skill}</span>
                                    </div>
                                </label>
                                );
                            })}
                        </div>

                        {errorMsg && <p className="text-red-500 font-medium text-sm mb-4 text-center">{errorMsg}</p>}

                        <button
                            disabled={selectedSkills.length === 0}
                            className={`w-full py-4 rounded-2xl font-bold shadow-xl flex flex-col items-center justify-center ${selectedSkills.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-transparent'}`}
                            onClick={() => setPageStatus("intro")}
                        >
                            <span className="text-base text-lg mb-1">Continue ({selectedSkills.length}/3)</span>
                            <span className="font-normal text-xs text-white/70">Next: what to expect</span>
                        </button>
                    </div>
                )}

                {/* INTRO / FRAMING */}
                {pageStatus === "intro" && (
                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 max-w-2xl mx-auto w-full">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-1">Before you start</h2>
                            <p className="text-slate-500 text-sm">A quick, honest overview — nothing is graded until you submit.</p>
                        </div>

                        {/* What's tested */}
                        <div className="p-5 bg-indigo-50/60 border border-indigo-100 rounded-2xl mb-5">
                            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-3">Skills tested</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedSkills.map((skill) => (
                                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700">
                                        <Target className="w-3.5 h-3.5" /> {skill}
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm text-slate-600">About <strong>{selectedSkills.length * 3} beginner-friendly multiple-choice questions</strong> (3 per skill).</p>
                        </div>

                        {/* Why */}
                        <div className="p-5 bg-white border border-slate-100 rounded-2xl mb-5">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Why verify?</p>
                            <ul className="space-y-2.5">
                                {[
                                    "Verified skills raise your match score and show recruiters real evidence of your ability",
                                    "Passing adds a Verified Skill badge to your profile and unlocks job applications",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                                        <span className="mt-0.5 w-5 h-5 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                                            <Sparkles className="w-3 h-3 text-indigo-500" />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Format stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-center">
                            {[
                                { label: "Questions", val: `~${selectedSkills.length * 3}` },
                                { label: "Time limit", val: "10 min" },
                                { label: "Pass mark", val: "60%" },
                                { label: "Retry after fail", val: "2 hours" },
                            ].map(({ label, val }) => (
                                <div key={label} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-lg font-black text-indigo-600">{val}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
                            The timer starts when the test loads and the limit is enforced by the server.{" "}
                            <Link href="/verification/skill-intro" className="underline font-bold text-slate-500 hover:text-indigo-600">Full details</Link>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={startTestGeneration}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95"
                            >
                                Start test <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setPageStatus("selection")}
                                className="px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {/* GENERATING */}
                {pageStatus === "generating" && (
                    <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 text-center max-w-2xl mx-auto w-full">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-bold text-slate-900 mb-1">Preparing your questions…</p>
                        <p className="text-sm text-slate-500">About {selectedSkills.length * 3} questions for {selectedSkills.join(", ")}. The timer starts once they&apos;re ready.</p>
                    </div>
                )}

                {/* TESTING */}
                {pageStatus === "testing" && testData && (
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-xl shadow-slate-200 border border-slate-100 max-w-2xl mx-auto w-full">

                        {/* Status bar: skills + countdown */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Testing</p>
                                <h2 className="text-base sm:text-lg font-black text-indigo-600 truncate">{(testData.skills || selectedSkills).join(", ")}</h2>
                            </div>
                            <div
                                role="timer"
                                aria-live="off"
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold border shrink-0 ${
                                    tone === "critical"
                                        ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                                        : tone === "warning"
                                            ? "bg-amber-50 text-amber-600 border-amber-200"
                                            : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                            >
                                <Clock className="w-4 h-4" />
                                <span className="text-base w-14 text-center tabular-nums">{formatCountdown(timeLeft)}</span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                            <span>Question {totalQuestions === 0 ? 0 : currentQ + 1} of {totalQuestions}</span>
                            <span>{answeredTotal} answered</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-4" role="progressbar" aria-valuenow={progressPercent(answers, questions)} aria-valuemin={0} aria-valuemax={100}>
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent(answers, questions)}%` }}
                            />
                        </div>

                        {/* Question navigation dots */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {questions.map((q, i) => {
                                const answered = isAnswered(answers[q.id]);
                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => goToQuestion(i)}
                                        aria-label={`Go to question ${i + 1}${answered ? " (answered)" : " (unanswered)"}`}
                                        className={`w-9 h-9 rounded-full text-xs font-black border-2 flex items-center justify-center transition-all ${
                                            i === currentQ
                                                ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                : answered
                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Warnings */}
                        {warnMsg && (
                            <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-bold">{warnMsg}</p>
                                </div>
                                <button onClick={() => setWarnMsg("")} className="text-sm underline shrink-0">Dismiss</button>
                            </div>
                        )}

                        {/* Current question — one per view, big tap targets */}
                        {currentQuestion && (
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg text-sm">
                                        {currentQ + 1}
                                    </div>
                                    <span className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg border ${
                                        currentQuestion.difficulty === "Simple"
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                            : "bg-amber-50 text-amber-600 border-amber-200"
                                    }`}>
                                        {currentQuestion.difficulty}
                                    </span>
                                    {isAnswered(answers[currentQuestion.id]) && (
                                        <span className="px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg border bg-indigo-50 text-indigo-600 border-indigo-200">
                                            Answered
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-5 leading-relaxed">{currentQuestion.prompt}</h3>

                                <div className="space-y-3">
                                    {(currentQuestion.options || []).map((opt, optIdx) => {
                                        const selected = answers[currentQuestion.id] === optIdx;
                                        return (
                                            <button
                                                key={`${currentQuestion.id}-${optIdx}`}
                                                type="button"
                                                onClick={() => handleAnswerChange(currentQuestion.id, optIdx)}
                                                aria-pressed={selected}
                                                className={`w-full min-h-[56px] flex items-center gap-3 text-left px-4 py-3 rounded-2xl border-2 transition-all select-text ${
                                                    selected
                                                        ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                                                        : "border-slate-200 bg-white hover:border-indigo-300 text-slate-700"
                                                }`}
                                            >
                                                <span className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-black ${
                                                    selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-400"
                                                }`}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span className="font-medium select-text">{opt}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => goToQuestion(currentQ - 1)}
                                disabled={currentQ === 0}
                                className={`flex items-center gap-1.5 px-5 py-3.5 rounded-2xl font-bold border-2 transition-all ${
                                    currentQ === 0
                                        ? "border-slate-100 text-slate-300 cursor-not-allowed"
                                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                                }`}
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            {currentQ < totalQuestions - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => goToQuestion(currentQ + 1)}
                                    className="flex items-center gap-1.5 px-7 py-3.5 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setPageStatus("review")}
                                    className="flex items-center gap-1.5 px-6 py-3.5 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                                >
                                    Review &amp; submit <ListChecks className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* REVIEW BEFORE SUBMIT */}
                {pageStatus === "review" && testData && (
                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 max-w-2xl mx-auto w-full">
                        <h2 className="text-xl font-black text-slate-900 mb-1">Review before submitting</h2>
                        <p className="text-slate-500 text-sm mb-5">
                            {answeredTotal} of {totalQuestions} questions answered · {formatCountdown(timeLeft)} left on the clock
                        </p>

                        {unansweredTotal > 0 && (
                            <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm font-bold">
                                    {unansweredTotal} unanswered question{unansweredTotal === 1 ? "" : "s"} — unanswered questions are marked incorrect.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
                            {questions.map((q, i) => {
                                const answered = isAnswered(answers[q.id]);
                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => goToQuestion(i)}
                                        aria-label={`Question ${i + 1}: ${answered ? "answered" : "unanswered"}`}
                                        className={`h-12 rounded-xl border-2 font-black text-sm flex items-center justify-center gap-1 transition-all ${
                                            answered
                                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 bg-white text-slate-400 hover:border-amber-300"
                                        }`}
                                    >
                                        {i + 1}
                                        {answered ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>

                        {confirmSubmit ? (
                            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                                <p className="font-black text-amber-900 text-sm mb-1">Submit your test now?</p>
                                <p className="text-xs text-amber-700 mb-4">
                                    {unansweredTotal > 0
                                        ? `${unansweredTotal} unanswered question${unansweredTotal === 1 ? "" : "s"} will be marked incorrect. `
                                        : ""}
                                    This cannot be undone.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSubmitTest()}
                                        className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                                    >
                                        Yes, submit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmSubmit(false)}
                                        className="flex-1 py-3.5 border border-slate-200 bg-white rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Keep reviewing
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => setConfirmSubmit(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                                >
                                    Submit test <Send className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPageStatus("testing")}
                                    className="px-8 py-3.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Back to questions
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* SUBMITTING */}
                {pageStatus === "submitting" && (
                    <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 text-center max-w-2xl mx-auto w-full">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-bold text-slate-900 mb-1">Submitting your answers…</p>
                        <p className="text-sm text-slate-500">Your test is being graded securely on the server.</p>
                    </div>
                )}

                {/* RESULT */}
                {pageStatus === "result" && resultData && (
                    <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 text-center max-w-2xl mx-auto w-full relative overflow-hidden">

                        {resultData.result === "pass" ? (
                            <>
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/20 blur-3xl rounded-full pointer-events-none" />
                                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 relative z-10">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2">Congratulations!</h2>
                                <p className="text-emerald-600 font-bold mb-2 text-lg">
                                    You passed the test for {(resultData.verifiedSkills || selectedSkills).join(", ")}.
                                </p>
                                <p className="text-slate-500 text-sm mb-8">Next step: Complete the Communication Verification to unlock job applications.</p>
                            </>
                        ) : (
                            <>
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-400/20 blur-3xl rounded-full pointer-events-none" />
                                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6 relative z-10">
                                    <ShieldAlert className="w-12 h-12" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2 text-red-600">Not this time</h2>
                                <p className="text-slate-500 mb-2 text-sm max-w-sm mx-auto">
                                    You scored below the 60% pass mark. Review the basics below — they are an honest map of what to study next.
                                </p>
                                {resultData.nextAttemptAt && (
                                    <p className="text-sm font-bold text-slate-700 mb-6">
                                        You can retake the test {formatRetryIn(resultData.nextAttemptAt)}.
                                    </p>
                                )}
                            </>
                        )}

                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mb-6 max-w-md mx-auto relative z-10">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Final Score</p>
                            <div className="flex items-end justify-center gap-2 mb-3">
                                <span className="text-5xl font-black text-slate-900 tabular-nums">{resultData.score}</span>
                                <span className="text-slate-400 text-xl font-bold pb-1">/ 100</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mb-4">Pass mark: {resultData.passingScore ?? 60}%</p>
                            {resultData.feedback && (
                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-t border-slate-200 pt-4">&quot;{resultData.feedback}&quot;</p>
                            )}
                        </div>

                        {/* Per-skill breakdown */}
                        {Array.isArray(resultData.perSkill) && resultData.perSkill.length > 0 && (
                            <div className="mb-8 max-w-md mx-auto relative z-10 text-left">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Skill breakdown</p>
                                <div className="space-y-2">
                                    {resultData.perSkill.map((s) => (
                                        <div key={s.skill} className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                            <span className="font-bold text-slate-800 text-sm">{s.skill}</span>
                                            <span className={`text-sm font-black tabular-nums ${(s.score ?? 0) >= 60 ? "text-emerald-600" : "text-red-500"}`}>
                                                {s.correct}/{s.total} · {s.score}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 p-4 border-t border-slate-100 justify-center relative z-10">
                            {resultData.result === "pass" ? (
                                <>
                                    <button
                                        onClick={() => router.push("/verification/communication-intro")}
                                        className="px-8 py-4 text-white rounded-2xl font-bold shadow-xl transition-all bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Continue → Communication Test
                                    </button>
                                    <button
                                        onClick={() => router.push("/jobs")}
                                        className="px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Browse Jobs
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            if (resultData.nextAttemptAt && new Date(resultData.nextAttemptAt) > new Date()) {
                                                setErrorMsg(`You can retake the test ${formatRetryIn(resultData.nextAttemptAt)}. Use the time to review the basics.`);
                                                setPageStatus("error");
                                            } else {
                                                setPageStatus("selection");
                                            }
                                        }}
                                        className="px-8 py-4 text-white rounded-2xl font-bold shadow-xl transition-all bg-slate-900 hover:bg-slate-800"
                                    >
                                        Retake later
                                    </button>
                                    <Link
                                        href="/skill-gap-detection"
                                        className="px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center justify-center"
                                    >
                                        Review skill gaps
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
