"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import Link from "next/link";
import {
  Briefcase,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  Clock,
} from "lucide-react";

export default function MyJobsPage() {
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) return;

    const fetchMyJobs = async () => {
      try {
        const response = await apiFetch(`/api/jobs/my-jobs/${user.uid}`);
        if (!response.ok) throw new Error("Failed to fetch jobs");

        const data = await response.json();
        if (data.success) {
          setJobs(data.jobs || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyJobs();
  }, [isAuthenticated, user?.uid]);

  const handleDeleteJob = async (jobId) => {
    if (!confirm("Are you sure you want to request deletion for this job? An admin will need to approve this request.")) return;

    try {
      const response = await apiFetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setJobs(jobs.filter((job) => job._id !== jobId));
      }
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Please Sign In
          </h1>
          <p className="text-slate-600">
            You need to be signed in to view your jobs.
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
            {[...Array(3)].map((_, i) => (
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

  return (
    <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
            <Link
              href="/post-job"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </Link>
          </div>
          <p className="text-slate-600">
            Manage your job postings and track applicants
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {jobs.length}
                </p>
                <p className="text-sm text-slate-500">Active Jobs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {jobs.reduce(
                    (total, job) => total + (job.applicantsCount || 0),
                    0,
                  )}
                </p>
                <p className="text-sm text-slate-500">Total Applicants</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {
                    jobs.filter((job) => {
                      const postedDate = new Date(job.createdAt);
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return postedDate >= thirtyDaysAgo;
                    }).length
                  }
                </p>
                <p className="text-sm text-slate-500">Posted This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              No Jobs Posted Yet
            </h2>
            <p className="text-slate-600 mb-6">
              Start by posting your first job to attract qualified candidates.
            </p>
            <Link
              href="/post-job"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl shrink-0">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-slate-600 font-medium mb-2">
                          {job.company}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salaryRange}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Posted{" "}
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                          {job.deadline && (
                            <div className={`flex items-center gap-1 font-semibold ${new Date(job.deadline) < new Date() ? "text-red-500" : "text-orange-500"}`}>
                              <Clock className="w-4 h-4" />
                              Deadline: {new Date(job.deadline).toLocaleDateString()}
                            </div>
                          )}
                          {job.vacancies && (
                            <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <Users className="w-4 h-4" />
                              {job.vacancies} Vacancies
                            </div>
                          )}
                          {/* Status Badge */}
                          <div className="flex items-center gap-1 ml-auto lg:ml-0">
                            {job.status === "approved" ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-wider">Public</span>
                            ) : job.status === "pending" ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold uppercase tracking-wider">Pending Approval</span>
                            ) : job.status === "delete_requested" ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-bold uppercase tracking-wider">Deletion Requested</span>
                            ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider">{job.status || 'Draft'}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.skills?.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills?.length > 5 && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="flex items-center gap-2 text-blue-600 font-semibold">
                        <Users className="w-4 h-4" />
                        {job.applicantsCount || 0} applicants
                      </div>
                      <p className="text-xs text-slate-500">
                        View applications
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View applicants"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit job"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        disabled={job.status === "delete_requested"}
                        className={`p-2 rounded-lg transition-colors ${job.status === "delete_requested" ? "text-slate-300 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
                        title={job.status === "delete_requested" ? "Deletion Pending Admin Approval" : "Request Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
