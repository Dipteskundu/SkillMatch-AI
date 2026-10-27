"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/apiClient";
import { classifyUploadResponse, classifyStatusResponse } from "../lib/resumeStatus";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

const acceptedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// Async pipeline polling: every ~3s, giving up after ~40s with an honest message.
const POLL_INTERVAL_MS = 3000;
const POLL_CAP_MS = 40000;
const MAX_BAD_POLLS = 3;

export default function ResumePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [file, setFile] = useState(null);
  // idle -> uploading -> processing -> done | failed
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState(null);
  const [suspicious, setSuspicious] = useState(false);
  const [pollToken, setPollToken] = useState(0);
  const uploadWarning = useRef("");

  const isAuthenticated = useMemo(() => !!user?.uid, [user]);
  const busy = phase === "uploading" || phase === "processing";

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setError("");
    setSuccess("");

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setError("File size must be 10MB or less.");
      setFile(null);
      return;
    }

    if (!acceptedTypes.includes(nextFile.type)) {
      setError("Please upload PDF, DOC, DOCX, or TXT format.");
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      setError("Please sign in first to upload your resume.");
      return;
    }

    if (!file) {
      setError("Please select a resume file first.");
      return;
    }

    setPhase("uploading");
    setError("");
    setSuccess("");
    setResult(null);
    setSuspicious(false);
    uploadWarning.current = "";

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("candidateId", user.uid);

      const response = await api.post("/api/resume/upload", formData);
      const payload = response?.data;
      const classified = classifyUploadResponse(payload);

      if (classified.kind === "queued") {
        // New async backend — poll until extraction finishes.
        setPhase("processing");
        return;
      }

      if (classified.kind === "ready") {
        // Old synchronous backend — data came straight back.
        setResult(classified.result);
        uploadWarning.current = classified.warning || "";
        setSuccess(
          classified.warning
            ? `Resume uploaded with limited parsing: ${classified.warning}`
            : "Resume uploaded and analyzed successfully.",
        );
        setPhase("done");
        return;
      }

      setError(classified.message || "Resume upload failed.");
      setPhase("idle");
    } catch (uploadError) {
      setError(uploadError?.response?.data?.message || uploadError?.message || "Resume upload failed.");
      setPhase("idle");
    }
  };

  /* ── Poll GET /api/resume/status/:uid while extraction runs ──────── */
  useEffect(() => {
    if (phase !== "processing" || !user?.uid) return;

    let cancelled = false;
    let badPolls = 0;
    const startedAt = Date.now();

    const id = setInterval(async () => {
      if (cancelled) return;

      if (Date.now() - startedAt >= POLL_CAP_MS) {
        setError("Analysis is taking longer than expected. Please try again.");
        setPhase("failed");
        return;
      }

      let classified;
      try {
        const res = await api.get(`/api/resume/status/${user.uid}`);
        if (cancelled) return;
        classified = classifyStatusResponse(res?.data);
      } catch {
        if (cancelled) return;
        badPolls += 1;
        if (badPolls >= MAX_BAD_POLLS) {
          setError("Couldn't check the analysis status. Check your connection and try again.");
          setPhase("failed");
        }
        return;
      }

      if (classified.kind === "active") {
        badPolls = 0;
        return;
      }

      if (classified.kind === "failed") {
        setError(classified.message || "Resume analysis failed. Please try again.");
        setPhase("failed");
        return;
      }

      if (classified.kind === "done" || classified.kind === "suspicious") {
        if (!classified.result) {
          badPolls += 1;
          if (badPolls >= MAX_BAD_POLLS) {
            setError("The analysis finished without any extracted data. Please try again.");
            setPhase("failed");
          }
          return;
        }
        setResult(classified.result);
        setSuspicious(classified.kind === "suspicious");
        setSuccess(
          uploadWarning.current
            ? `Resume uploaded with limited parsing: ${uploadWarning.current}`
            : "Resume analyzed successfully.",
        );
        setPhase("done");
        return;
      }

      // Unrecognized payload (mixed deploy / unexpected shape) — tolerate a
      // couple of them before telling the user the truth.
      badPolls += 1;
      if (badPolls >= MAX_BAD_POLLS) {
        setError("The server returned an unexpected analysis status. Please try again.");
        setPhase("failed");
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, user?.uid, pollToken]);

  const handleRetry = () => {
    setError("");
    setPollToken(token => token + 1);
    setPhase("processing");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Upload Resume</h1>
          <p className="mt-2 text-sm text-slate-600">
            Upload your resume to extract skills and improve matching quality.
          </p>

          {!isAuthenticated && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              You need to sign in before uploading your resume.
            </div>
          )}

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Resume file (PDF / DOC / DOCX / TXT)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              disabled={busy}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700 disabled:opacity-60"
            />

            {error && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <span>{error}</span>
                {phase === "failed" && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                )}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {/* Processing state machine */}
            {phase === "processing" && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 shrink-0 animate-spin text-indigo-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Analyzing your resume…</p>
                    <p className="text-xs text-slate-500">
                      Extracting skills and experience — this usually takes a few seconds.
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-500" />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={busy || !isAuthenticated}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phase === "uploading" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                  </span>
                ) : phase === "processing" ? (
                  "Analyzing..."
                ) : (
                  "Upload & Analyze"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Go to Profile
              </button>
            </div>
          </div>
        </section>

        {/* Content needing review — still shows the extracted results below. */}
        {phase === "done" && suspicious && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h2 className="text-sm font-bold text-amber-800">Some content needs a quick review</h2>
                <p className="mt-1 text-sm text-amber-700">
                  Parts of the uploaded file look unusual, so we&apos;ve flagged the results below for you
                  to double-check. Nothing was applied automatically beyond your profile skills.
                </p>
              </div>
            </div>
          </section>
        )}

        {phase === "done" && result && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Extracted Result
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Experience (years)
                </p>
                <p className="mt-2 text-lg font-bold text-slate-800">
                  {result.experience_years ?? 0}
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Roles
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {(result.role_titles || []).join(", ") || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Skills
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {(result.skills || []).join(", ") || "—"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Technologies
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {(result.technologies || []).join(", ") || "—"}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
