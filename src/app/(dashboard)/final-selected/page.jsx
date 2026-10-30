"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/AuthContext";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { UserCheck, User, PartyPopper, Loader2, Mail } from "lucide-react";
import PipelineLayout from "../../components/PipelineLayout/PipelineLayout";

export default function FinalSelectedPage() {
  const { user, isAuthenticated } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiringId, setHiringId] = useState(null);

  const fetchCandidates = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await apiFetch(`/api/applications/recruiter/${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setCandidates((data.applications || []).filter(a => a.status === "final_selected" || a.status === "hired"));
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

  const handleHire = async (app) => {
    setHiringId(app._id);
    try {
      const res = await apiFetch(`/api/applications/${app._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "hired" }),
      });
      if (res.ok) {
        setCandidates(prev => prev.map(a => a._id === app._id ? { ...a, status: "hired" } : a));
      }
    } catch (error) { console.error(error); }
    finally { setHiringId(null); }
  };

  if (!isAuthenticated) return null;

  return (
    <PipelineLayout activePhase="final-selected">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-indigo-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No candidates in final selection</h3>
          <p className="text-slate-500 text-sm">Select candidates from Completed Interviews to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map(app => {
            const isHired = app.status === "hired";
            return (
              <div key={app._id} className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow ${isHired ? "border-emerald-200" : "border-slate-200"}`}>
                <div className={`p-5 flex items-start gap-3 ${isHired ? "bg-emerald-50/40" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isHired ? "bg-emerald-100" : "bg-indigo-100"}`}>
                    <User className={`w-5 h-5 ${isHired ? "text-emerald-600" : "text-indigo-600"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{app.email}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${isHired ? "text-emerald-600" : "text-indigo-600"}`}>
                      {app.jobTitle}
                    </p>
                    <span className={`inline-block mt-2 px-2.5 py-0.5 text-xs font-bold rounded-full ${isHired ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {isHired ? "🎉 Hired!" : "Final Selected"}
                    </span>
                  </div>
                </div>
                <div className="mt-auto border-t border-slate-100">
                  {isHired ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-emerald-600">
                      <PartyPopper className="w-4 h-4" />
                      Successfully Hired
                    </div>
                  ) : (
                    <button
                      onClick={() => handleHire(app)}
                      disabled={hiringId === app._id}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                    >
                      {hiringId === app._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Connect & Hire
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PipelineLayout>
  );
}
