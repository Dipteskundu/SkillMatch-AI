"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import {
  useGetRecruiterJobsQuery,
  useGetRecruiterApplicationsQuery,
  useCopilotPipelineSummaryMutation,
  useCopilotOutreachDraftMutation,
  useCopilotInterviewQuestionsMutation,
} from "../../store/api/apiSlice";
import {
  Sparkles, BarChart3, Mail, HelpCircle, Loader2, RefreshCw,
  AlertCircle, Copy, Check, Users, Briefcase, Wand2,
} from "lucide-react";

const TONES = [
  { value: "", label: "Default tone" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "concise", label: "Concise" },
];

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Payloads may arrive bare or wrapped in `{success, data}` — read both. */
function unwrap(payload, hasKey) {
  const root = isObject(payload) ? payload : {};
  const inner = isObject(root.data) ? root.data : {};
  if (hasKey(root)) return root;
  if (hasKey(inner)) return inner;
  return null;
}

function readPipeline(payload) {
  const body = unwrap(payload, (v) => typeof v.summary === "string" || Array.isArray(v.insights));
  if (!body) return null;
  return {
    summary: typeof body.summary === "string" ? body.summary : "",
    insights: (Array.isArray(body.insights) ? body.insights : [])
      .filter((item) => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim()),
  };
}

function readDraft(payload) {
  const body = unwrap(payload, (v) => typeof v.subject === "string" || typeof v.body === "string");
  if (!body) return null;
  const subject = String(body.subject || "").trim();
  const text = String(body.body || body.text || "").trim();
  if (!subject && !text) return null;
  return { subject, body: text };
}

function readQuestions(payload) {
  const body = unwrap(payload, (v) => Array.isArray(v.questions));
  if (!body) return null;
  const questions = (Array.isArray(body.questions) ? body.questions : [])
    .filter((q) => isObject(q) && typeof q.question === "string" && q.question.trim())
    .map((q) => ({
      skill: String(q.skill || "").trim(),
      question: String(q.question).trim(),
      whatToLookFor: String(q.whatToLookFor || q.what_to_look_for || "").trim(),
    }));
  return questions;
}

/**
 * Honest failure copy for the three copilot calls. RTK hands us either a
 * rejected-query error ({status, data}) or — because apiClient resolves HTTP
 * 500s — a resolved payload with success:false.
 */
function failureMessage({ isError, error, data }) {
  if (isError) {
    const status = error?.status;
    const serverMsg = error?.data?.message || error?.message;
    if (status === 401) return "Your session has expired. Sign in again and retry.";
    if (status === 403) return "This account doesn't have recruiter access to the AI Copilot.";
    if (status === 404) return "AI Copilot isn't available on this server yet.";
    if (status === 429) return serverMsg || "Too many AI requests — wait a few minutes and try again.";
    if (!status) return "Couldn't reach the server. Check your connection and try again.";
    return serverMsg || "AI unavailable — try again in a moment.";
  }
  if (isObject(data) && data.success === false) {
    return data.message || "AI unavailable — try again in a moment.";
  }
  return null;
}

export default function CopilotPage() {
  const { user, isAuthenticated } = useAuth();
  const uid = user?.uid;

  const jobsQuery = useGetRecruiterJobsQuery(uid, { skip: !uid });
  const appsQuery = useGetRecruiterApplicationsQuery(uid, { skip: !uid });

  const jobs = useMemo(() => jobsQuery.data?.jobs || [], [jobsQuery.data]);
  const applications = useMemo(
    () => appsQuery.data?.applications || [],
    [appsQuery.data],
  );
  // apiClient resolves HTTP 500s, so a "successful" response can still fail.
  const jobsLoadFailed =
    jobsQuery.isError || Boolean(jobsQuery.data && jobsQuery.data.success === false);
  const appsLoadFailed =
    appsQuery.isError || Boolean(appsQuery.data && appsQuery.data.success === false);

  /* ── Pipeline summary ── */
  const [summaryJobId, setSummaryJobId] = useState("");
  const [runSummary, summaryState] = useCopilotPipelineSummaryMutation();

  /* ── Outreach draft ── */
  const [outreachAppId, setOutreachAppId] = useState("");
  const [tone, setTone] = useState("");
  const [runOutreach, outreachState] = useCopilotOutreachDraftMutation();

  /* ── Interview questions ── */
  const [questionsJobId, setQuestionsJobId] = useState("");
  const [questionsAppId, setQuestionsAppId] = useState("");
  const [runQuestions, questionsState] = useCopilotInterviewQuestionsMutation();

  // Reset the applicant pick when the application list reloads for a new user.
  useEffect(() => {
    setOutreachAppId("");
    setQuestionsAppId("");
  }, [uid]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Please Sign In</h2>
          <Link href="/signin" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSummary = async () => {
    if (!uid) return;
    try {
      await runSummary({ uid, jobId: summaryJobId || undefined }).unwrap();
    } catch {
      // failureMessage() below reads the RTK error state — nothing to do here.
    }
  };

  const handleOutreach = async () => {
    if (!uid || !outreachAppId) return;
    try {
      await runOutreach({ uid, applicationId: outreachAppId, tone: tone || undefined }).unwrap();
    } catch {
      /* handled via outreachState */
    }
  };

  const handleQuestions = async () => {
    if (!uid || !questionsJobId) return;
    try {
      await runQuestions({
        uid,
        jobId: questionsJobId,
        applicationId: questionsAppId || undefined,
      }).unwrap();
    } catch {
      /* handled via questionsState */
    }
  };

  const pipelineResult = summaryState.isSuccess ? readPipeline(summaryState.data) : null;
  const pipelineError = failureMessage({
    isError: summaryState.isError,
    error: summaryState.error,
    data: summaryState.data,
  });

  const draftResult = outreachState.isSuccess ? readDraft(outreachState.data) : null;
  const draftError = failureMessage({
    isError: outreachState.isError,
    error: outreachState.error,
    data: outreachState.data,
  });

  const questionsResult = questionsState.isSuccess ? readQuestions(questionsState.data) : null;
  const questionsError = failureMessage({
    isError: questionsState.isError,
    error: questionsState.error,
    data: questionsState.data,
  });

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Recruiter only</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">AI Copilot</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Draft-level help for your pipeline — every result is yours to review before anything is used.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-10">
          {/* ── Pipeline summary ── */}
          <Card
            icon={<BarChart3 className="w-4 h-4 text-indigo-600" />}
            title="Pipeline summary"
            hint="A short read on where your candidates stand."
          >
            <Field label="Job (optional)">
              <select
                value={summaryJobId}
                onChange={(e) => setSummaryJobId(e.target.value)}
                disabled={jobsQuery.isLoading}
                className={selectCls}
              >
                <option value="">{jobsQuery.isLoading ? "Loading jobs…" : "All my jobs"}</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}{job.company ? ` — ${job.company}` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <button
              type="button"
              onClick={handleSummary}
              disabled={summaryState.isLoading || jobsQuery.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {summaryState.isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Summarizing…</>
                : <><Wand2 className="w-4 h-4" /> Summarize</>}
            </button>

            {summaryState.isLoading && <Skeleton rows={3} />}

            {!summaryState.isLoading && pipelineError && (
              <ErrorNotice message={pipelineError} onRetry={handleSummary} />
            )}

            {!summaryState.isLoading && !pipelineError && pipelineResult && (
              <div className="space-y-3">
                {pipelineResult.summary && (
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50 p-4">
                    {pipelineResult.summary}
                  </p>
                )}
                {pipelineResult.insights.length > 0 && (
                  <ul className="space-y-2">
                    {pipelineResult.insights.map((insight, index) => (
                      <li key={`${index}-${insight.slice(0, 24)}`} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!summaryState.isLoading && !pipelineError && !pipelineResult && (
              <EmptyHint
                icon={<Users className="w-5 h-5" />}
                text={jobsLoadFailed
                  ? "Couldn't load your jobs. Refresh the page and try again."
                  : jobsQuery.isLoading
                    ? "Loading your jobs…"
                    : "Pick a job (or all of them) and hit Summarize for a read on your pipeline."}
              />
            )}
          </Card>

          {/* ── Interview questions ── */}
          <Card
            icon={<HelpCircle className="w-4 h-4 text-indigo-600" />}
            title="Interview questions"
            hint="Skill-tagged questions generated for the role."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Job *">
                <select
                  value={questionsJobId}
                  onChange={(e) => setQuestionsJobId(e.target.value)}
                  disabled={jobsQuery.isLoading}
                  className={selectCls}
                >
                  <option value="">{jobsQuery.isLoading ? "Loading jobs…" : "Select a job"}</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title}{job.company ? ` — ${job.company}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Applicant (optional)">
                <select
                  value={questionsAppId}
                  onChange={(e) => setQuestionsAppId(e.target.value)}
                  disabled={appsQuery.isLoading}
                  className={selectCls}
                >
                  <option value="">{appsQuery.isLoading ? "Loading…" : "Any applicant"}</option>
                  {applications.map((app) => (
                    <option key={app._id} value={app._id}>
                      {app.displayName || app.email}{app.jobTitle ? ` — ${app.jobTitle}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              type="button"
              onClick={handleQuestions}
              disabled={!questionsJobId || questionsState.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {questionsState.isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing questions…</>
                : <><HelpCircle className="w-4 h-4" /> Generate questions</>}
            </button>

            {questionsState.isLoading && <Skeleton rows={4} />}

            {!questionsState.isLoading && questionsError && (
              <ErrorNotice message={questionsError} onRetry={handleQuestions} />
            )}

            {!questionsState.isLoading && !questionsError && questionsResult && (
              <ol className="space-y-3">
                {questionsResult.map((item, index) => (
                  <li key={`${index}-${item.skill}`} className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        {item.skill || "General"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">{item.question}</p>
                    {item.whatToLookFor && (
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                        <span className="font-black text-slate-400 uppercase tracking-wider">What to look for: </span>
                        {item.whatToLookFor}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {!questionsState.isLoading && !questionsError && !questionsResult && (
              <EmptyHint
                icon={<Briefcase className="w-5 h-5" />}
                text={jobsLoadFailed
                  ? "Couldn't load your jobs. Refresh the page and try again."
                  : jobs.length === 0 && !jobsQuery.isLoading
                    ? "Post a job first — questions are generated from the role you're hiring for."
                    : "Choose a job (and optionally an applicant) to generate a question list."}
              />
            )}
          </Card>

          {/* ── Outreach draft (full width) ── */}
          <Card
            icon={<Mail className="w-4 h-4 text-indigo-600" />}
            title="Outreach draft"
            hint="A starting point for your own email — nothing is sent for you."
            className="xl:col-span-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Field label="Applicant *">
                  <select
                    value={outreachAppId}
                    onChange={(e) => setOutreachAppId(e.target.value)}
                    disabled={appsQuery.isLoading}
                    className={selectCls}
                  >
                    <option value="">{appsQuery.isLoading ? "Loading applicants…" : "Select an applicant"}</option>
                    {applications.map((app) => (
                      <option key={app._id} value={app._id}>
                        {app.displayName || app.email}{app.jobTitle ? ` — ${app.jobTitle}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Tone">
                <select value={tone} onChange={(e) => setTone(e.target.value)} className={selectCls}>
                  {TONES.map((option) => (
                    <option key={option.value || "default"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOutreach}
                disabled={!outreachAppId || outreachState.isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {outreachState.isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Drafting…</>
                  : <><Mail className="w-4 h-4" /> Draft outreach</>}
              </button>
              {draftResult && <CopyButton draft={draftResult} />}
            </div>

            {outreachState.isLoading && <Skeleton rows={4} />}

            {!outreachState.isLoading && draftError && (
              <ErrorNotice message={draftError} onRetry={handleOutreach} />
            )}

            {!outreachState.isLoading && !draftError && draftResult && (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Subject</p>
                  <p className="text-sm font-bold text-slate-900 break-words">{draftResult.subject || "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Body</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{draftResult.body}</p>
                </div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Draft only — review and send from your own email.
                </p>
              </div>
            )}

            {!outreachState.isLoading && !draftError && !draftResult && (
              <EmptyHint
                icon={<Mail className="w-5 h-5" />}
                text={appsLoadFailed
                  ? "Couldn't load your applicants. Refresh the page and try again."
                  : applications.length === 0 && !appsQuery.isLoading
                    ? "No applications yet — drafts appear once candidates apply to your jobs."
                    : "Pick an applicant to draft a first-contact email. You'll always send it yourself."}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const selectCls =
  "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60";

function Card({ icon, title, hint, className = "", children }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 ${className}`}>
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 rounded-lg">{icon}</div>
          <h2 className="font-black text-slate-900 text-sm">{title}</h2>
        </div>
        {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      )}
      {children}
    </div>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`h-3.5 bg-slate-100 rounded ${index === 0 ? "w-3/4" : index % 2 ? "w-full" : "w-5/6"}`}
        />
      ))}
    </div>
  );
}

function ErrorNotice({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
        <p className="text-sm font-semibold text-rose-700 flex-1">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

function EmptyHint({ icon, text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
      <div className="inline-flex text-slate-300 mb-2">{icon}</div>
      <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
    </div>
  );
}

function CopyButton({ draft }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const text = `Subject: ${draft.subject || ""}\n\n${draft.body || ""}`;

  const handleCopy = async () => {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers / insecure context — fall back to a hidden textarea.
      try {
        const node = document.createElement("textarea");
        node.value = text;
        node.setAttribute("readonly", "");
        node.style.position = "fixed";
        node.style.opacity = "0";
        document.body.appendChild(node);
        node.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(node);
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
        setFailed(true);
      } catch {
        setFailed(true);
      }
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
      >
        {copied ? <><Check className="w-4 h-4 text-emerald-600" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
      </button>
      {failed && (
        <span className="text-xs font-semibold text-rose-600">
          Copy failed — select the text and press Ctrl+C.
        </span>
      )}
    </span>
  );
}
