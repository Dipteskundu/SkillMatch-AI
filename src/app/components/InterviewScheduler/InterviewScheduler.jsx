"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  X,
  Check,
  AlertCircle,
  Phone,
} from "lucide-react";
import { safeError } from "../../lib/logger";

export default function InterviewScheduler({
  applicant,
  isOpen,
  onClose,
  onSchedule,
}) {
  const [interviewData, setInterviewData] = useState({
    type: "video", // video, phone, in-person
    interviewTitle: "",
    date: "",
    time: "",
    durationMinutes: 30,
    timezone: "Asia/Dhaka",
    location: "",
    meetingUrl: "",
    meetingId: "",
    notes: "",
    recruiterInstructions: "",
    candidateInstructions: "",
    reminderTime: "15", // minutes before
  });

  const [isScheduling, setIsScheduling] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!interviewData.date) {
      newErrors.date = "Date is required";
    }

    if (!interviewData.time) {
      newErrors.time = "Time is required";
    }

    // Remove old manual link requirement for video type since backend generates it now

    if (interviewData.type === "in-person" && !interviewData.location) {
      newErrors.location = "Location is required for in-person interviews";
    }

    // Check if date is in the past
    const interviewDateTime = new Date(
      `${interviewData.date}T${interviewData.time}`,
    );
    if (interviewDateTime < new Date()) {
      newErrors.datetime = "Cannot schedule interviews in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsScheduling(true);

    try {
      const durationMinutes = Number(interviewData.durationMinutes);
      const interviewTitle =
        interviewData.interviewTitle?.trim() ||
        `${applicant.jobTitle || "Interview"}`;

      const interviewDetails = {
        type: interviewData.type,
        interviewTitle,
        date: interviewData.date,
        time: interviewData.time,
        durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 30,
        timezone: interviewData.timezone || "Asia/Dhaka",
        notes: interviewData.notes,
        recruiterInstructions: interviewData.recruiterInstructions,
        candidateInstructions: interviewData.candidateInstructions,
        location: interviewData.location,

        applicantId: applicant.firebaseUid,
        applicationId: applicant._id,
        jobId: applicant.jobId,
        applicantEmail: applicant.email,
        jobTitle: applicant.jobTitle,
        company: applicant.company,
      };


      await onSchedule(interviewDetails);
      onClose();

      // Reset form
      setInterviewData({
        type: "video",
        interviewTitle: "",
        date: "",
        time: "",
        durationMinutes: 30,
        timezone: "Asia/Dhaka",
        location: "",
        meetingUrl: "",
        meetingId: "",
        notes: "",
        recruiterInstructions: "",
        candidateInstructions: "",
        reminderTime: "15",
      });
    } catch (error) {
      safeError("Failed to schedule interview", error);
    } finally {
      setIsScheduling(false);
    }
  };

  const generateZoomLink = () => {
    // Deprecated for Jitsi - backend generates the link
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Schedule Interview
              </h2>
              <p className="text-slate-600 mt-1">
                with {applicant.email} for {applicant.jobTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Interview Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Interview Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "video", label: "Video Call", icon: Video },
                { value: "phone", label: "Phone Call", icon: Phone },
                { value: "in-person", label: "In-Person", icon: MapPin },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setInterviewData((prev) => ({ ...prev, type: value }))
                  }
                  className={`p-3 rounded-lg border-2 transition-all ${
                    interviewData.type === value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interview Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Interview Title
            </label>
            <input
              type="text"
              placeholder="e.g., Technical Interview"
              value={interviewData.interviewTitle}
              onChange={(e) =>
                setInterviewData((prev) => ({
                  ...prev,
                  interviewTitle: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={interviewData.date}
                onChange={(e) =>
                  setInterviewData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                min={new Date().toISOString().split("T")[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.date ? "border-red-300" : "border-slate-300"
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                value={interviewData.time}
                onChange={(e) =>
                  setInterviewData((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.time ? "border-red-300" : "border-slate-300"
                }`}
              />
              {errors.time && (
                <p className="text-red-500 text-xs mt-1">{errors.time}</p>
              )}
            </div>
          </div>

          {errors.datetime && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-red-700 text-sm">{errors.datetime}</p>
            </div>
          )}

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Duration
            </label>
            <select
              value={interviewData.durationMinutes}
              onChange={(e) =>
                setInterviewData((prev) => ({
                  ...prev,
                  durationMinutes: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Timezone
            </label>
            <input
              type="text"
              placeholder="Asia/Dhaka"
              value={interviewData.timezone}
              onChange={(e) =>
                setInterviewData((prev) => ({
                  ...prev,
                  timezone: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Conditional Fields Based on Type */}
          {interviewData.type === "video" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Video Meeting Details
              </label>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
                A secure Jitsi meeting link will be automatically generated and shared with the candidate when you schedule.
              </div>
            </div>
          )}

          {interviewData.type === "in-person" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                placeholder="Office address, room number, etc."
                value={interviewData.location}
                onChange={(e) =>
                  setInterviewData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.location ? "border-red-300" : "border-slate-300"
                }`}
              />
              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location}</p>
              )}
            </div>
          )}

          {interviewData.type === "phone" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Candidate will call this number"
                value={interviewData.location}
                onChange={(e) =>
                  setInterviewData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Reminder Time */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Send Reminder
            </label>
            <select
              value={interviewData.reminderTime}
              onChange={(e) =>
                setInterviewData((prev) => ({
                  ...prev,
                  reminderTime: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="0">No reminder</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Additional Notes
            </label>
            <textarea
              placeholder="Any additional information for the candidate..."
              value={interviewData.notes}
              onChange={(e) =>
                setInterviewData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Recruiter Instructions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Recruiter Instructions
            </label>
            <textarea
              placeholder="Private instructions for the interviewer..."
              value={interviewData.recruiterInstructions}
              onChange={(e) =>
                setInterviewData((prev) => ({
                  ...prev,
                  recruiterInstructions: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Candidate Instructions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Candidate Instructions
            </label>
            <textarea
              placeholder="Instructions visible to the candidate..."
              value={interviewData.candidateInstructions}
              onChange={(e) =>
                setInterviewData((prev) => ({
                  ...prev,
                  candidateInstructions: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isScheduling}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isScheduling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Schedule Interview
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
