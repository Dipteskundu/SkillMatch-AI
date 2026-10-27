"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useAuth } from "../../lib/AuthContext";
import api, { API_BASE } from "../../lib/apiClient";
import ApplicationPulseTracker from "../../dashboard/components/candidate/ApplicationPulseTracker";
import GrowthFeedbackCard from "../../components/GrowthFeedback/GrowthFeedbackCard";
import { applicationScore, scoreBand } from "../../lib/scoreDisplay";

export default function ApplicationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);
  // Lazily-fetched rejection feedback for applications whose payload
  // doesn't inline it: { [applicationId]: { status, feedback } }
  const [fetchedFeedback, setFetchedFeedback] = useState({});

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setLoading(false);
      return;
    }

    const fetchApps = async () => {
    try {
        setLoading(true);
        const res = await api.get(`/api/dashboard/candidate/${user.uid}`);
        const json = res.data;
        if (json.success) {
            setApplications(json.data.applications || []);
        } else {
            setError(json.message || "Failed to load applications");
        }
      } catch (err) {
        console.error(err);
        setError("Server error while fetching applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [isAuthenticated, user]);

  // Fetch rejection feedback on demand from the feedback endpoint when the
  // application payload didn't include it. Avoids N+1 on page load.
  const loadFeedback = async (app) => {
    const id = app?._id;
    if (!id || fetchedFeedback[id]) return;
    setFetchedFeedback((prev) => ({ ...prev, [id]: { status: "loading", feedback: null } }));
    try {
      const res = await api.get(`/api/applications/${id}/feedback`);
      const json = res.data;
      const feedback = json?.data?.feedback ?? json?.feedback ?? json?.data ?? null;
      setFetchedFeedback((prev) => ({
        ...prev,
        [id]: { status: "done", feedback: feedback && typeof feedback === "object" ? feedback : null },
      }));
    } catch (err) {
      console.error(err);
      setFetchedFeedback((prev) => ({ ...prev, [id]: { status: "error", feedback: null } }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6">My Applications</h1>

        {!isAuthenticated && (
          <p className="text-slate-500">Sign in to see your applications.</p>
        )}

        {loading && <p className="text-slate-500">Loading applications…</p>}

        {!loading && error && <p className="text-red-600">{error}</p>}

        {!loading && !error && isAuthenticated && applications.length === 0 && (
          <div className="p-6 border rounded-md bg-white/5">
            <p className="text-slate-400">You have no applications yet.</p>
            <Link
              href="/jobs"
              className="text-indigo-500 underline mt-3 inline-block"
            >
              Browse jobs
            </Link>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <ul className="space-y-4">
            {applications.map((app) => {
              const score = applicationScore(app);
              const band = scoreBand(score);
              const isRejected = app.status === "rejected";
              // Prefer the feedback already in the payload; else whatever we
              // fetched lazily from GET /api/applications/:id/feedback.
              // A plain string (recruiter typed a note) becomes { message }.
              const lazy = fetchedFeedback[app._id];
              const rawFeedback =
                app.feedback && typeof app.feedback === "object"
                  ? app.feedback
                  : typeof app.feedback === "string" && app.feedback
                    ? { message: app.feedback }
                    : lazy?.feedback ?? null;
              const feedback =
                typeof rawFeedback === "string" && rawFeedback
                  ? { message: rawFeedback }
                  : rawFeedback;
              const hasFeedback =
                Boolean(feedback) &&
                (feedback.missingSkills?.length > 0 ||
                  feedback.suggestedActions?.length > 0 ||
                  typeof feedback.message === "string");
              return (
              <li key={app._id} className="p-4 border rounded-md bg-white/3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      <Link href={`/jobs/${app.jobId}`}>
                        {app.jobTitle || "Job"}
                      </Link>
                    </h3>
                    <p className="text-sm text-slate-400">{app.company}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Applied on: {new Date(app.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {score !== null ? (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-bold ${band.className}`}
                        title="Your explainable fit score for this role"
                      >
                        {score} match
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold text-slate-500 bg-slate-100 border-slate-200">
                        Not scored yet
                      </span>
                    )}
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-600 text-white font-bold text-sm">
                      {app.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <ApplicationPulseTracker application={app} />
                </div>

                {/* Rejection feedback — "gap to growth" */}
                {isRejected && (
                  <div className="mt-4">
                    {!feedback && !lazy && (
                      <button
                        onClick={() => loadFeedback(app)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
                      >
                        See why & what to improve
                      </button>
                    )}
                    {lazy?.status === "loading" && (
                      <p className="text-sm text-slate-400">Loading feedback…</p>
                    )}
                    {lazy?.status === "error" && (
                      <p className="text-sm text-slate-400">
                        Feedback is unavailable right now.
                      </p>
                    )}
                    {hasFeedback && (
                      <div>
                        {feedback.message && (
                          <div className="mb-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                              Recruiter feedback
                            </p>
                            <p className="text-sm text-slate-700">{feedback.message}</p>
                          </div>
                        )}
                        <GrowthFeedbackCard
                          feedback={feedback}
                          jobTitle={app.jobTitle}
                          company={app.company}
                        />
                        {feedback.missingSkills?.length > 0 && (
                          <Link
                            href={`/skill-gap-analysis/${app.jobId}`}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            Get your skill-gap report
                          </Link>
                        )}
                      </div>
                    )}
                    {lazy?.status === "done" && !hasFeedback && (
                      <p className="text-sm text-slate-400 italic">
                        No written feedback was provided for this decision.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
            })}
          </ul>
        )}
      </div>
  );
}
