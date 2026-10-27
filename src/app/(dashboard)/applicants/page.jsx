"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/AuthContext";
import api, { API_BASE } from "../../lib/apiClient";
import {
  Users, User, SlidersHorizontal, Star, X, Loader2,
  ChevronLeft, ChevronRight, BadgeCheck, MoreVertical, Target,
} from "lucide-react";
import Link from "next/link";
import PipelineLayout from "../../components/PipelineLayout/PipelineLayout";
import InterviewScheduler from "../../components/InterviewScheduler/InterviewScheduler";
import Avatar from "../../components/common/Avatar";
import FitMapModal from "../../components/FitMap/FitMapModal";
import { applicationScore, scoreBand } from "../../lib/scoreDisplay";

const PAGE_SIZE = 7;

const STATUS_META = {
  submitted:           { label: "Pending",            color: "text-slate-500",    bg: "bg-slate-100",    border: "border-slate-200" },
  shortlisted:         { label: "Shortlisted",         color: "text-emerald-700",  bg: "bg-emerald-50",   border: "border-emerald-200" },
  task_sent:           { label: "Task Sent",           color: "text-blue-700",     bg: "bg-blue-50",      border: "border-blue-200" },
  task_accepted:       { label: "Task Accepted",       color: "text-cyan-700",     bg: "bg-cyan-50",      border: "border-cyan-200" },
  task_submitted:      { label: "Task Submitted",      color: "text-yellow-700",   bg: "bg-yellow-50",    border: "border-yellow-200" },
  interview_selected:  { label: "Interview Sel.",      color: "text-violet-700",   bg: "bg-violet-50",    border: "border-violet-200" },
  interviewing:        { label: "Interviewing",        color: "text-orange-700",   bg: "bg-orange-50",    border: "border-orange-200" },
  interview_completed: { label: "Interview Done",      color: "text-purple-700",   bg: "bg-purple-50",    border: "border-purple-200" },
  final_selected:      { label: "Final Selected",      color: "text-indigo-700",   bg: "bg-indigo-50",    border: "border-indigo-200" },
  hired:               { label: "Hired",               color: "text-emerald-700",  bg: "bg-emerald-50",   border: "border-emerald-200" },
  rejected:            { label: "Rejected",            color: "text-red-600",      bg: "bg-red-50",       border: "border-red-200" },
};

const matchColor = (score) => scoreBand(score).className;

export default function ApplicantsPage() {
  const { user, isAuthenticated } = useAuth();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [fitApplicant, setFitApplicant] = useState(null);

  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [selectedApplicantForInterview, setSelectedApplicantForInterview] = useState(null);

  const fetchApplicants = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await api.get(`/api/applications/recruiter/${user.uid}`);
      const data = res.data;
      if (data.success) setApplicants(data.applications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user?.uid]);

  useEffect(() => { if (user?.uid) fetchApplicants(); }, [user?.uid, fetchApplicants]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await api.put(`/api/applications/${appId}/status`, { status: newStatus });
      if (res.status === 200 || res.data.success) setApplicants(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
    } catch (err) { console.error(err); }
    setOpenMenuId(null);
  };

  const handleShortlist = (app) => handleStatusChange(app._id, "shortlisted");
  const handleReject = (app) => {
    if (confirm(`Remove ${app.email} from consideration?`)) handleStatusChange(app._id, "rejected");
  };
  const handleBulkShortlist = () => {
    const eligible = filteredApplicants.filter(a => a.status === "submitted");
    if (!eligible.length) return;
    if (confirm(`Shortlist ${eligible.length} candidate(s)?`)) eligible.forEach(a => handleStatusChange(a._id, "shortlisted"));
  };

  const handleInterviewScheduled = async (interviewData) => {
    const res = await api.post("/api/interviews/schedule", interviewData);
    const result = res.data;
    if (result.success) {
      const appId = applicants.find(a => a._id === interviewData.applicationId)?._id;
      if (appId) setApplicants(prev => prev.map(a => a._id === appId ? { ...a, status: "interviewing" } : a));
    }
    setShowInterviewScheduler(false);
  };

  const filteredApplicants = applicants.filter(app => {
    const q = searchTerm.toLowerCase();
    // New shape: aiScore.total; legacy: numeric aiScore or matchScore.
    // Unscored candidates (null) only pass when the filter is at 0.
    const score = applicationScore(app) ?? 0;
    return (
      (app.email?.toLowerCase().includes(q) || app.jobTitle?.toLowerCase().includes(q) || app.displayName?.toLowerCase().includes(q)) &&
      score >= minMatch
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / PAGE_SIZE));
  const paginated = filteredApplicants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const shortlistEligible = filteredApplicants.filter(a => a.status === "submitted").length;

  if (!isAuthenticated) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Please Sign In</h2>
        <Link href="/signin" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">Sign In</Link>
      </div>
    </div>
  );

  return (
    <PipelineLayout activePhase="applicants">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Min Match: {minMatch}%</span>
            <span className="ml-auto text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {filteredApplicants.length} Candidates
            </span>
          </div>
          <input type="range" min={0} max={100} step={5} value={minMatch}
            onChange={e => { setMinMatch(Number(e.target.value)); setPage(1); }}
            className="w-full accent-indigo-600" />
        </div>
        <button onClick={handleBulkShortlist} disabled={shortlistEligible === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
          <Star className="w-4 h-4" /> Shortlist All ({shortlistEligible})
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search candidates..." value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading applicants...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No applicants found</h3>
          <p className="text-slate-500 text-sm">Try lowering the match % filter or adjusting your search.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map(applicant => {
              const score = applicationScore(applicant);
              const sm = STATUS_META[applicant.status] || STATUS_META.submitted;
              const isPast = ["task_sent","task_accepted","task_submitted","interview_selected","interviewing","interview_completed","final_selected","hired"].includes(applicant.status);
              const isRejected = applicant.status === "rejected";
              const isShortlisted = applicant.status === "shortlisted";
              const canAct = !isPast && !isRejected && !isShortlisted;
              const name = applicant.displayName || applicant.email?.split("@")[0] || "Candidate";

              return (
                <div key={applicant._id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-150"
                  onClick={() => openMenuId === applicant._id && setOpenMenuId(null)}>
                  <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">

                    {/* LEFT: Avatar + name (clickable → profile) */}
                    <Link href={`/profile/${applicant.firebaseUid}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                      onClick={e => e.stopPropagation()}>
                      <div className="relative shrink-0">
                        <Avatar
                          src={applicant.photoURL || null}
                          alt={name}
                          size="w-11 h-11"
                          className="rounded-full border-2 border-slate-100 shadow-sm"
                        />
                        {applicant.isSkillVerified && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <BadgeCheck className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {name}
                        </p>
                        <p className="text-xs text-slate-400 font-medium truncate">{applicant.jobTitle || "Applicant"}</p>
                        {/* Match % visible on mobile only */}
                        <span className={`sm:hidden inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black border ${matchColor(score)}`}>
                          {score !== null ? `${score}% match` : "Not scored"}
                        </span>
                      </div>
                    </Link>

                    {/* RIGHT: Match % + Toggle + Menu */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      {/* Explainable match score — click to open the Fit Map */}
                      {applicant.jobId && applicant.firebaseUid ? (
                        <button
                          onClick={e => { e.stopPropagation(); setFitApplicant(applicant); }}
                          title="See this candidate's fit breakdown"
                          className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${matchColor(score)}`}
                        >
                          {score !== null ? (
                            <>MATCH <span className="ml-1">{score}%</span></>
                          ) : (
                            <>NOT SCORED</>
                          )}
                        </button>
                      ) : (
                        <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border ${matchColor(score)}`}>
                          {score !== null ? <>MATCH <span className="ml-1">{score}%</span></> : <>NOT SCORED</>}
                        </span>
                      )}

                      {/* 3-state toggle: only for pending candidates */}
                      {!isPast && !isRejected && !isShortlisted ? (
                        <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden text-[11px] font-black">
                          <button
                            onClick={e => { e.stopPropagation(); handleShortlist(applicant); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border-r border-slate-200">
                            <Star className="w-3 h-3" /> Shortlist
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleReject(applicant); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      ) : isShortlisted ? (
                        /* Shortlisted — click to undo */
                        <button
                          onClick={e => { e.stopPropagation(); handleStatusChange(applicant._id, "submitted"); }}
                          title="Click to undo shortlist"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black hover:bg-emerald-100 transition-colors">
                          <Star className="w-3 h-3 fill-emerald-500" /> Shortlisted
                        </button>
                      ) : isRejected ? (
                        /* Rejected — click to restore */
                        <button
                          onClick={e => { e.stopPropagation(); handleStatusChange(applicant._id, "submitted"); }}
                          title="Click to restore"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-[11px] font-black hover:bg-red-100 transition-colors">
                          <X className="w-3 h-3" /> Rejected
                        </button>
                      ) : (
                        /* Past pipeline stage — read-only status */
                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black border ${sm.bg} ${sm.color} ${sm.border}`}>
                          {sm.label}
                        </span>
                      )}

                      {/* Action menu */}
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === applicant._id ? null : applicant._id); }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === applicant._id && (
                          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-slate-200 shadow-xl py-1 min-w-[160px]"
                            onClick={e => e.stopPropagation()}>
                            {!isPast && (
                              <>
                                {!isShortlisted && (
                                  <button onClick={() => handleShortlist(applicant)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">
                                    <Star className="w-4 h-4" /> Shortlist
                                  </button>
                                )}
                                {!isRejected && (
                                  <button onClick={() => handleReject(applicant)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                                    <X className="w-4 h-4" /> Reject
                                  </button>
                                )}
                                {(isShortlisted || isRejected) && (
                                  <button onClick={() => { handleStatusChange(applicant._id, "submitted"); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                    Restore to Pending
                                  </button>
                                )}
                                <div className="border-t border-slate-100 my-1" />
                              </>
                            )}
                            {applicant.jobId && applicant.firebaseUid && (
                              <button onClick={() => { setFitApplicant(applicant); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                                <Target className="w-4 h-4" /> View Fit Map
                              </button>
                            )}
                            <Link href={`/profile/${applicant.firebaseUid}`}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                              onClick={() => setOpenMenuId(null)}>
                              View Full Profile
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 flex-wrap gap-3 pb-6 pr-36 sm:pr-6">
            <p className="text-sm text-slate-500 font-medium">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredApplicants.length)} of {filteredApplicants.length} candidates
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                      page === p ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-110" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-indigo-200"
                    }`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Fit Map — recruiter view of a candidate's explainable fit (uid = candidate) */}
      {fitApplicant && (
        <FitMapModal
          job={{ _id: fitApplicant.jobId, title: fitApplicant.jobTitle, company: fitApplicant.company }}
          uid={fitApplicant.firebaseUid}
          onClose={() => setFitApplicant(null)}
        />
      )}

      {/* Interview Scheduler */}
      {showInterviewScheduler && selectedApplicantForInterview && (
        <InterviewScheduler
          applicant={selectedApplicantForInterview}
          isOpen={showInterviewScheduler}
          onClose={() => { setShowInterviewScheduler(false); setSelectedApplicantForInterview(null); }}
          onSchedule={handleInterviewScheduled}
        />
      )}
    </PipelineLayout>
  );
}
