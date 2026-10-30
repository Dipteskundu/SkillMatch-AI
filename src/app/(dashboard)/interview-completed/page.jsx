"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/AuthContext";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { CheckCircle2, User, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import PipelineLayout from "../../components/PipelineLayout/PipelineLayout";

export default function InterviewCompletedPage() {
  const { user, isAuthenticated } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await apiFetch(`/api/applications/recruiter/${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setCandidates((data.applications || []).filter(a => a.status === "interview_completed"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    fetchCandidates();
  }, [user?.uid, fetchCandidates]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await apiFetch(`/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setCandidates(prev => prev.filter(a => a._id !== appId));
    } catch (error) { console.error(error); }
  };

  if (!isAuthenticated) return null;

  return (
    <PipelineLayout activePhase="completed">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center shadow-sm">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-purple-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No completed interviews</h3>
          <p className="text-slate-500 text-sm">Mark interviews as completed from the Scheduled stage to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map(app => (
            <div key={app._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{app.email}</p>
                  <p className="text-xs text-purple-600 font-semibold mt-0.5">{app.jobTitle}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    Interview Completed
                  </span>
                </div>
              </div>
              <div className="mt-auto border-t border-slate-100 grid grid-cols-2">
                <button
                  onClick={() => { if (confirm("Reject this candidate?")) handleStatusChange(app._id, "rejected"); }}
                  className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 border-r border-slate-100 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleStatusChange(app._id, "final_selected")}
                  className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" /> Select
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PipelineLayout>
  );
}
