"use client";

import { useAuth } from "../lib/AuthContext";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Skeleton from "../components/common/Skeleton";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Bookmark,
  Trash2,
  ChevronRight,
  Search,
} from "lucide-react";
import Link from "next/link";
import PageWrapper from "../components/common/PageWrapper";
import {
  useGetSavedJobsQuery,
  useUnsaveJobMutation,
} from "../store/api/apiSlice";

export default function SavedJobsPage() {
  const { user, isAuthenticated } = useAuth();
  const { data, isError } = useGetSavedJobsQuery(user?.uid, {
    skip: !user?.uid,
  });
  const [unsaveJob] = useUnsaveJobMutation();

  // apiClient resolves HTTP 500s into `{ success: false }` bodies.
  const error = isError
    ? "Failed to load saved jobs."
    : data && !data.success
      ? data.message
      : null;
  const savedJobs = data?.success ? data.data || [] : [];
  // Skeleton until the query settles (mirrors the old local loading state).
  const loading = !data && !isError;

  const handleUnsave = async (savedId) => {
    if (
      !confirm("Are you sure you want to remove this job from your saved list?")
    )
      return;

    try {
      const res = await unsaveJob(savedId);
      if (res.error) throw res.error;
      if (!res.data?.success) {
        alert("Failed to unsave job: " + (res.data?.message || ""));
      }
      // On success the ['savedJobs'] tag invalidation refetches the list.
    } catch (err) {
      console.error("Unsave error:", err);
      alert("An error occurred while unsaving.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 animate-fade-in">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md text-center transform transition-all hover:scale-105 duration-300">
          <Bookmark className="w-16 h-16 text-indigo-500 mx-auto mb-6 opacity-20" />
          <h1 className="text-2xl font-black text-foreground mb-4">
            Saved Jobs
          </h1>
          <p className="text-muted-foreground font-medium mb-8">
            Please sign in to view your saved jobs and track your career
            interests.
          </p>
          <Link
            href="/signin"
            className="block w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-page-enter">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24 md:pt-32">
        <PageWrapper>
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 animate-fade-up">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="w-5 h-5 text-indigo-600 animate-bounce" />
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                  Your Private Collection
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                Saved <span className="text-indigo-600">Jobs</span>
              </h1>
              <p className="text-muted-foreground font-medium mt-2 max-w-xl">
                Keep track of roles that interest you. Apply whenever
                you&apos;re ready or review them later.
              </p>
            </div>

            <Link
              href="/jobs"
              className="flex items-center gap-2.5 bg-white border border-slate-200 text-foreground px-6 py-3.5 rounded-2xl font-black shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 hover:shadow-lg"
            >
              <Search className="w-5 h-5" />
              Explore More Jobs
            </Link>
          </div>

          {/* Saved Jobs List */}
          <div className="space-y-6 reveal">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6"
                  >
                    <div className="flex justify-between">
                      <Skeleton className="w-14 h-14 rounded-2xl" />
                      <Skeleton className="w-8 h-8 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-red-600 font-bold">
                {error}
              </div>
            ) : savedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedJobs.map((job) => (
                  <div
                    key={job._id}
                    className="group relative bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        {job.company?.[0] || "J"}
                      </div>
                      <button
                        onClick={() => handleUnsave(job._id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-slate-400 font-bold text-sm mb-6 flex items-center gap-1.5">
                      {job.company}
                    </p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2.5 text-slate-500 font-medium text-sm">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-slate-400" />
                        </div>
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-500 font-medium text-sm">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                        </div>
                        {job.salaryRange || job.salary || "Competitive"}
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-500 font-medium text-sm">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        Saved on {new Date(job.savedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <Link
                      href={`/jobs/${job.jobId}`}
                      className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  No saved jobs yet
                </h3>
                <p className="text-slate-400 font-medium mb-8 max-w-sm mx-auto">
                  Discover your dream role by browsing our latest job listings.
                </p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Start Searching
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
