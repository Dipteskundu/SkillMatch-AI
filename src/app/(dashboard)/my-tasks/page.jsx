"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/AuthContext";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { CheckCircle, Clock, ExternalLink, Github, FileText, Send } from "lucide-react";
import Link from "next/link";

export default function MyTasksPage() {
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // To handle application lookup for a task
  const [applications, setApplications] = useState([]);

  const [activeTask, setActiveTask] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    githubUrl: "",
    liveUrl: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await apiFetch(`/api/tasks/candidate/${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        setApplications(data.applications || []);
      } else {
        throw new Error(data.message || "Failed to load tasks");
      }
    } catch (err) {
      console.error("Failed to fetch my tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    fetchData();
  }, [user?.uid, fetchData]);

  // Lightweight polling so status updates appear without manual refresh
  useEffect(() => {
    if (!user?.uid) return;
    const id = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(id);
  }, [user?.uid, fetchData]);

  const getTaskApplication = (taskId, assignedApplicants) => {
    // find which application belongs to this user that is assigned to this task
    const assigned = Array.isArray(assignedApplicants)
      ? assignedApplicants.map((id) => (typeof id === "string" ? id : id?.toString?.()))
      : [];

    return applications.find(
      (app) =>
        app?.firebaseUid === user.uid &&
        assigned.includes(typeof app?._id === "string" ? app._id : app?._id?.toString?.()),
    );
  };

  const handleAcceptTask = async (task, application) => {
    try {
      const res = await apiFetch(`/api/tasks/${task._id}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application._id })
      });
      if (res.ok) {
        fetchData(); // re-fetch to update status
      }
    } catch (err) {
      console.error("Failed to accept task:", err);
    }
  };

  const isValidUrl = (value) => {
    if (!value || typeof value !== "string") return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!submissionForm.githubUrl || !activeTask) {
      setError("GitHub URL is required.");
      return;
    }

    if (!isValidUrl(submissionForm.githubUrl)) {
      setError("Please enter a valid GitHub repository URL (https://...).");
      return;
    }

    if (submissionForm.liveUrl && !isValidUrl(submissionForm.liveUrl)) {
      setError("Please enter a valid Live Demo URL (https://...) or leave it empty.");
      return;
    }

    const application = getTaskApplication(activeTask._id, activeTask.assignedApplicants);
    if (!application) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await apiFetch(`/api/tasks/${activeTask._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          applicationId: application._id,
          ...submissionForm
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to submit task.");
      }

      // Optimistically update local state so the UI reflects success immediately
      setApplications((prev) =>
        prev.map((a) =>
          a._id === application._id ? { ...a, status: "task_submitted" } : a,
        ),
      );
      setActiveTask(null);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        fetchData(); // Refresh UI to remove submitted task
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Please Sign In</h1>
          <Link href="/signin" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Filter out tasks whose corresponding application is no longer in task_sent / task_accepted state
  // Only show tasks that are pending action.
  const pendingTasks = tasks.map(t => {
    return { task: t, application: getTaskApplication(t._id, t.assignedApplicants) };
  }).filter(({application}) => application && (application.status === "task_sent" || application.status === "task_accepted" || application.status === "task_submitted"));

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-slate-600 mt-2">Complete technical assignments from recruiters.</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-600 mt-2">Loading tasks...</p>
        </div>
      ) : pendingTasks.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
          <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending tasks found</h3>
          <p className="text-slate-600">You&apos;re all caught up! Keep checking back.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingTasks.map(({ task, application }) => (
            <div key={task._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
                  <p className="text-sm text-slate-600 mt-1">For application: {application.jobTitle} at {application.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">
                    Deadline: {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description
                </h3>
                <p className="text-slate-700 whitespace-pre-line">{task.description}</p>
              </div>

              {task.requirements && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Requirements / Instructions</h3>
                  <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-800 whitespace-pre-line">
                    {task.requirements}
                  </div>
                </div>
              )}

              {application.status === "task_sent" && (
                <div className="border-t border-slate-200 pt-6 flex items-center justify-between bg-yellow-50 p-4 rounded-lg">
                  <p className="font-medium text-yellow-800">Action Required: You have been assigned this task.</p>
                  <button
                    onClick={() => handleAcceptTask(task, application)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
                  >
                    Accept & Begin
                  </button>
                </div>
              )}

              {application.status === "task_accepted" && activeTask?._id !== task._id && (
                <div className="border-t border-slate-200 pt-6 flex items-center justify-between">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Task Accepted - In Progress
                  </span>
                  <button
                    onClick={() => {
                      setActiveTask(task);
                      setSubmissionForm({ githubUrl: "", liveUrl: "", notes: "" });
                    }}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Task
                  </button>
                </div>
              )}

              {application.status === "task_submitted" && (
                <div className="border-t border-slate-200 pt-6 flex items-center justify-between bg-emerald-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-medium">Task Submitted Successfully. Awaiting recruiter review.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase">
                    Under Review
                  </span>
                </div>
              )}

              {activeTask?._id === task._id && (
                <form onSubmit={handleSubmitTask} className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Submit Your Work</h3>
                  
                  {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                  {success && <p className="text-green-600 text-sm font-medium mb-4">Task Submitted Successfully!</p>}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        <Github className="w-4 h-4" /> GitHub Repository URL *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://github.com/..."
                        value={submissionForm.githubUrl}
                        onChange={(e) => setSubmissionForm({...submissionForm, githubUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Live Demo URL (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://..."
                        value={submissionForm.liveUrl}
                        onChange={(e) => setSubmissionForm({...submissionForm, liveUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Notes for Recruiter (Optional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Any additional context..."
                        value={submissionForm.notes}
                        onChange={(e) => setSubmissionForm({...submissionForm, notes: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTask(null)}
                      className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Send Submission"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
