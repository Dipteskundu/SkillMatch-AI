"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import api, { API_BASE } from "../../lib/apiClient";
import PipelineLayout from "../../components/PipelineLayout/PipelineLayout";
import {
  Clock,
  Users,
  Calendar,
  Mail,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Phone,
  ExternalLink,
  Building,
} from "lucide-react";
import InterviewScheduler from "../../components/InterviewScheduler/InterviewScheduler";
import InterviewDetailsModal from "../../components/InterviewDetailsModal/InterviewDetailsModal";
import { safeError } from "../../lib/logger";

export default function InterviewsPage() {
  const { user, userProfile, role, isAuthenticated } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const router = useRouter();

  const handleScheduleInterview = () => {
    setShowInterviewScheduler(true);
  };

  const handleInterviewScheduled = async (interviewData) => {
    const res = await api.post("/api/interviews/schedule", interviewData);
    const result = res.data;
    if (result.success) {
      await refreshInterviews();
      setShowInterviewScheduler(false);
    } else if (!result._serverError) {
      throw new Error(result.message || "Failed to schedule interview");
    }
    setShowInterviewScheduler(false);
  };

  const refreshInterviews = useCallback(async () => {
    if (!isAuthenticated || !user?.uid || !role) return;
    try {
      setLoading(true);
      const endpoint =
        role === "candidate"
          ? `/api/interviews/candidate`
          : `/api/interviews/recruiter`;

      const response = await api.get(endpoint);
      const data = response.data;
      if (data.success) setInterviews(data.interviews || []);
    } catch (err) {
      // 500 = server Firebase config issue — show empty state, don't crash
      if (err?.response?.status !== 500) setError(err.message);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, role]);

  useEffect(() => {
    refreshInterviews();
  }, [refreshInterviews]);

  // Poll so scheduled interviews appear without manual refresh
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) return;
    const id = setInterval(() => {
      refreshInterviews();
    }, 15000);
    return () => clearInterval(id);
  }, [isAuthenticated, user?.uid, refreshInterviews]);

  const handleStatusChange = async (interviewId, newStatus) => {
    const response = await api.put(
      `/api/interviews/${interviewId}/status`,
      { status: newStatus }
    );
    if (response.data?.success) {
      setInterviews(interviews.map((i) =>
        i._id === interviewId ? { ...i, status: newStatus } : i,
      ));
    }
  };

  const handleJoinMeeting = (interviewId) => {
    const interview = interviews.find((i) => i._id === interviewId);
    const meetingLink =
      interview?.meetingLink ||
      interview?.meetingUrl ||
      (interview?.meetingRoomName
        ? `https://meet.jit.si/${interview.meetingRoomName}`
        : null);

    if (!meetingLink) return;
    window.open(meetingLink, "_blank", "noopener,noreferrer");
  };

  const filteredInterviews = interviews.filter((interview) => {
    const matchesFilter = filter === "all" || interview.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      interview.applicantEmail
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      interview.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.company?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((int) => int.status === "scheduled").length,
    completed: interviews.filter((int) => int.status === "completed").length,
    cancelled: interviews.filter((int) => int.status === "cancelled").length,
    upcoming: interviews.filter(
      (int) =>
        int.status === "scheduled" &&
        new Date(int.scheduledDateTime) > new Date(),
    ).length,
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Please Sign In
          </h1>
          <p className="text-slate-600">
            You need to be signed in to view interviews.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <>
      {/* Stats Cards - Hide most for candidates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">{role === "candidate" ? "Total Appointments" : "Total Interviews"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.upcoming}</p>
              <p className="text-sm text-slate-500">Upcoming</p>
            </div>
          </div>
        </div>
        {role === "recruiter" && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                  <p className="text-sm text-slate-500">Completed</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 text-red-600 p-3 rounded-xl">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.cancelled}</p>
                  <p className="text-sm text-slate-500">Cancelled</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={role === "candidate" ? "Search by company or job title..." : "Search by candidate email, job title, or company..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          {role === "recruiter" && (
            <button
              onClick={handleScheduleInterview}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Interview
            </button>
          )}
        </div>
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Clock className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {searchQuery || filter !== "all"
              ? "No Matching Interviews"
              : "No Interviews Scheduled"}
          </h2>
          <p className="text-slate-600">
            {searchQuery || filter !== "all"
              ? "Try adjusting your filters or search query."
              : role === "candidate" ? "You don't have any interviews scheduled yet." : "Schedule your first interview when you shortlist candidates."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInterviews.map((interview) => (
            <div
              key={interview._id}
              onClick={() => setSelectedInterview(interview)}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform ${
                        interview.status === "completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : interview.status === "cancelled"
                            ? "bg-red-50 text-red-600"
                            : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      {interview.status === "completed" ? (
                        <CheckCircle className="w-7 h-7" />
                      ) : interview.status === "cancelled" ? (
                        <XCircle className="w-7 h-7" />
                      ) : interview.type === "video" ? (
                        <Video className="w-7 h-7" />
                      ) : interview.type === "phone" ? (
                        <Phone className="w-7 h-7" />
                      ) : (
                        <MapPin className="w-7 h-7" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-black text-slate-900 truncate">
                          {role === "candidate" ? interview.company : interview.applicantEmail}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            interview.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : interview.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {interview.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Users className="w-4 h-4 text-indigo-500" />
                          {interview.jobTitle}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(interview.scheduledDateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {new Date(interview.scheduledDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {interview.duration && (
                          <div className="text-slate-400 font-medium">
                            {interview.duration} mins
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {interview.status === "scheduled" && (
                    <>
                      {interview.type === "video" &&
                        (interview.meetingLink || interview.meetingUrl || interview.meetingRoomName) && (
                        <button
                          onClick={() => handleJoinMeeting(interview._id)}
                          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-indigo-700 hover:shadow-lg transition-all"
                        >
                          <Video className="w-4 h-4" />
                          Join Interview
                        </button>
                      )}
                      
                      {role === "recruiter" && (
                        <select
                          value={interview.status}
                          onChange={(e) => handleStatusChange(interview._id, e.target.value)}
                          className="text-sm font-bold border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </>
                  )}
                  {role === "recruiter" && (
                    <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                       <Mail className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interview Scheduler Modal */}
      {showInterviewScheduler && (
        <InterviewScheduler
          applicant={{
            _id: "manual-interview",
            firebaseUid: "manual-interview",
            email: "candidate@example.com",
            jobTitle: "Position to be determined",
            company: user?.displayName || "Your Company",
          }}
          isOpen={showInterviewScheduler}
          onClose={() => setShowInterviewScheduler(false)}
          onSchedule={handleInterviewScheduled}
        />
      )}

      {/* Interview Details Modal */}
      <InterviewDetailsModal
        interview={selectedInterview}
        role={role}
        isOpen={!!selectedInterview}
        onClose={() => setSelectedInterview(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      {role === "recruiter" ? (
        <PipelineLayout activePhase="scheduled">
          {content}
        </PipelineLayout>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Interviews</h1>
            <p className="text-slate-500 text-lg mt-2 font-medium">Keep track of your scheduled candidate assessments and video calls</p>
          </div>
          {content}
        </div>
      )}
    </div>
  );
}
