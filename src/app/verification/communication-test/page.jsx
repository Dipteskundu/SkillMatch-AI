"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Send, ShieldAlert, CheckCircle2, MessageCircle } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

export default function CommunicationTestPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [pageStatus, setPageStatus] = useState("loading"); // loading, testing, submitting, result, error, verified
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [warnMsg, setWarnMsg] = useState("");

  // Timer: 12 minutes
  const TIME_LIMIT = 720;
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const startSession = useCallback(async () => {
    if (!user?.uid) return;

    setPageStatus("loading");
    setErrorMsg("");
    setWarnMsg("");

    try {
      const res = await apiFetch(`/api/verification/communication/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: user.uid }),
      });
      const data = await res.json();

      if (data.alreadyVerified) {
        setPageStatus("verified");
        return;
      }

      if (data.cooldown) {
        setErrorMsg(data.message);
        setPageStatus("error");
        return;
      }

      if (res.ok && data.success) {
        setSessionId(data.sessionId);
        setQuestions(data.questions);
        const initAnswers = {};
        data.questions.forEach((q) => (initAnswers[q.id] = ""));
        setAnswers(initAnswers);
        setTimeLeft(TIME_LIMIT);
        setPageStatus("testing");
      } else {
        setErrorMsg(data.message || "Failed to start test.");
        setPageStatus("error");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please reload and try again.");
      setPageStatus("error");
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/signin");
  }, [loading, isAuthenticated, router]);

  // Start the test session on mount
  useEffect(() => {
    if (!loading && isAuthenticated) {
      startSession();
    }
  }, [isAuthenticated, loading, startSession]);

  const handleSubmit = useCallback(async () => {
    if (!sessionId) return;

    setPageStatus("submitting");
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: String(answer || "").trim(),
    }));
    try {
      const res = await apiFetch(`/api/verification/communication/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: formattedAnswers }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResultData(data);
        setPageStatus("result");
      } else {
        setErrorMsg(data.message || "Failed to submit test.");
        setPageStatus("error");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error while submitting.");
      setPageStatus("error");
    }
  }, [answers, sessionId]);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Timer countdown
  useEffect(() => {
    if (pageStatus !== "testing") return;
    if (timeLeft <= 0) {
      handleSubmitRef.current();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [pageStatus, timeLeft]);

  // Anti-cheating tab visibility
  useEffect(() => {
    const handler = () => {
      if (document.hidden && pageStatus === "testing") {
        setWarnMsg("Warning: Leaving the tab during the test may affect your result.");
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [pageStatus]);

  if (loading || pageStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Preparing your communication test...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 flex flex-col justify-center">

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Communication Verification Test</h1>
          <p className="text-slate-500 text-lg">Demonstrate your professional communication and workplace readiness.</p>
        </div>

        {/* ERROR / VERIFIED */}
        {(pageStatus === "error" || pageStatus === "verified") && (
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 text-center max-w-2xl mx-auto w-full">
            {pageStatus === "verified" ? (
              <>
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Already Communication Verified!</h2>
                <p className="text-slate-500 mb-8">You have already passed the communication test. You may now apply for jobs.</p>
                <button onClick={() => router.push("/jobs")} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
                  Browse Jobs
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Test Unavailable</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">{errorMsg}</p>
                <button onClick={() => router.push("/jobs")} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all text-sm">
                  Return to Jobs
                </button>
              </>
            )}
          </div>
        )}

        {/* TESTING / SUBMITTING */}
        {(pageStatus === "testing" || pageStatus === "submitting") && questions.length > 0 && (
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-slate-200 border border-slate-100 mb-12">
            {/* Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100 sticky top-0 bg-white z-10 pt-2">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Verification Type</p>
                <h2 className="text-xl font-black text-violet-600 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" /> Communication Test
                </h2>
              </div>
              <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold border ${timeLeft < 60 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-50 text-slate-700 border-slate-200"}`}>
                <Clock className="w-5 h-5" />
                <span className="text-lg w-16 text-center tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Warning */}
            {warnMsg && (
              <div className="mb-8 flex items-center justify-between gap-4 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">{warnMsg}</p>
                </div>
                <button onClick={() => setWarnMsg("")} className="text-sm underline">Dismiss</button>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-12">
              {questions.map((q, idx) => (
                <div key={q.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold shadow-lg text-sm">
                      {idx + 1}
                    </div>
                    <span className="px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg border bg-violet-50 text-violet-600 border-violet-200">
                      {q.type?.replace("_", " ") || "Communication"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 leading-relaxed">{q.text}</h3>
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    disabled={pageStatus === "submitting"}
                    placeholder="Write your professional response here..."
                    rows="6"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-y placeholder:text-slate-400 select-text"
                  />
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={pageStatus === "submitting"}
                className="px-10 py-5 bg-violet-600 text-white rounded-[1.5rem] font-black hover:bg-violet-700 transition-all active:scale-95 shadow-xl shadow-violet-200 flex items-center gap-3 disabled:opacity-50 text-base"
              >
                {pageStatus === "submitting" ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>Submit Test <Send className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {pageStatus === "result" && resultData && (
          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 text-center max-w-2xl mx-auto w-full relative overflow-hidden">
            {resultData.result === "pass" ? (
              <>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/20 blur-3xl rounded-full pointer-events-none" />
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 relative z-10">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 relative z-10">Congratulations! 🎉</h2>
                <p className="text-emerald-600 font-bold mb-8 text-lg relative z-10">You passed the Communication Test!</p>
              </>
            ) : (
              <>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-400/20 blur-3xl rounded-full pointer-events-none" />
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6 relative z-10">
                  <ShieldAlert className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-red-600 mb-2 relative z-10">Test Not Passed</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto relative z-10">
                  Don&apos;t worry! Review your communication skills and try again in 2 hours.
                </p>
              </>
            )}

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mb-8 max-w-md mx-auto relative z-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Your Score</p>
              <div className="flex items-end justify-center gap-2 mb-4">
                <span className="text-5xl font-black text-slate-900 tabular-nums">{resultData.score}</span>
                <span className="text-slate-400 text-xl font-bold pb-1">/ 100</span>
              </div>
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-t border-slate-200 pt-4">
                &quot;{resultData.feedback}&quot;
              </p>
            </div>

            <div className="flex gap-4 justify-center relative z-10">
              {resultData.result === "pass" ? (
                <button
                  onClick={() => router.push("/jobs")}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl"
                >
                  Browse & Apply for Jobs →
                </button>
              ) : (
                <button
                  onClick={() => router.push("/jobs")}
                  className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all"
                >
                  Return to Jobs
                </button>
              )}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
