"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  ExternalLink,
  X,
} from "lucide-react";
import api, { API_BASE } from "../../lib/apiClient";
import { useAuth } from "../../lib/AuthContext";
import { safeError } from "../../lib/logger";

export default function UpcomingInterviews({ uid }) {
  const { user, isAuthenticated } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const router = useRouter();


  const fetchUpcomingInterviews = useCallback(async () => {
    try {

      if (!isAuthenticated || !user?.uid) {
        setLoading(false);
        return;
      }

      if (uid && uid !== user.uid) {
        setLoading(false);
        return;
      }

      const res = await api.get("/api/interviews/candidate");
      const data = res.data;


      if (data.success) {
        // Handle both response structures
        const interviews = data.interviews || data.data?.interviews || [];

        // Filter for future interviews only
        const upcomingInterviews = interviews
          .filter(
            (interview) => new Date(interview.scheduledDateTime) > new Date(),
          )
          .sort(
            (a, b) =>
              new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime),
          );

        setInterviews(upcomingInterviews);
      } else {
      }
    } catch (error) {
      safeError("Failed to fetch upcoming interviews", error);
    } finally {
      setLoading(false);
    }
  }, [uid, isAuthenticated, user]);

  useEffect(() => {
    if (!uid) return;
    fetchUpcomingInterviews();
  }, [uid, fetchUpcomingInterviews]);

  const formatInterviewDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatInterviewTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getInterviewIcon = (type) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "in-person":
        return <MapPin className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getInterviewTypeLabel = (type) => {
    switch (type) {
      case "video":
        return "Video Call";
      case "phone":
        return "Phone Call";
      case "in-person":
        return "In-Person";
      default:
        return "Interview";
    }
  };

  const handleJoinMeeting = (interviewId) => {
    if (interviewId) {
      const interview = interviews.find((i) => i._id === interviewId);
      const meetingLink =
        interview?.meetingLink ||
        interview?.meetingUrl ||
        (interview?.meetingRoomName
          ? `https://meet.jit.si/${interview.meetingRoomName}`
          : null);

      if (!meetingLink) return;
      window.open(meetingLink, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Upcoming Interviews
        </h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-100 rounded-lg w-3/4 mb-2" />
                  <div className="h-3 bg-slate-50 rounded-lg w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Upcoming Interviews
        </h3>

        {interviews.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No upcoming interviews</p>
            <p className="text-slate-400 text-sm mt-1">
              Check back later for updates
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => (
              <div
                key={interview._id}
                className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors cursor-pointer"
                onClick={() => setSelectedInterview(interview)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    {getInterviewIcon(interview.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-900 truncate">
                        {interview.jobTitle}
                      </h4>
                      <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                        {interview.company}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
                      <span className="font-medium">
                        {formatInterviewDate(interview.scheduledDateTime)}
                      </span>
                      <span>•</span>
                      <span>
                        {formatInterviewTime(interview.scheduledDateTime)}
                      </span>
                      <span>•</span>
                      <span>{getInterviewTypeLabel(interview.type)}</span>
                    </div>

                    {interview.duration && (
                      <p className="text-xs text-slate-500">
                        Duration: {interview.duration} minutes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interview Detail Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Interview Details
              </h3>
              <button
                onClick={() => setSelectedInterview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {selectedInterview.jobTitle}
                </h4>
                <p className="text-slate-600">{selectedInterview.company}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  {getInterviewIcon(selectedInterview.type)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {getInterviewTypeLabel(selectedInterview.type)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatInterviewDate(selectedInterview.scheduledDateTime)}{" "}
                    at{" "}
                    {formatInterviewTime(selectedInterview.scheduledDateTime)}
                  </p>
                  {selectedInterview.duration && (
                    <p className="text-xs text-slate-500">
                      Duration: {selectedInterview.duration} minutes
                    </p>
                  )}
                </div>
              </div>

              {(selectedInterview.meetingLink || selectedInterview.meetingUrl || selectedInterview.meetingRoomName) && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Meeting Link:
                  </p>
                  <button
                    onClick={() =>
                      handleJoinMeeting(selectedInterview._id)
                    }
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Join Meeting
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {selectedInterview.location &&
                selectedInterview.type !== "video" && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      Location:
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedInterview.location}
                    </p>
                  </div>
                )}

              {selectedInterview.meetingId && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Meeting ID:
                  </p>
                  <p className="text-sm text-slate-600 font-mono">
                    {selectedInterview.meetingId}
                  </p>
                </div>
              )}

              {selectedInterview.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Additional Notes:
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedInterview.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedInterview(null)}
                className="w-full py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
