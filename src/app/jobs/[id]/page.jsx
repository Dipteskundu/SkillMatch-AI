"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../lib/AuthContext";
import api, { API_BASE } from "../../lib/apiClient";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  Star,
  Share2,
  Loader2,
  AlertCircle,
  Calendar,
  Globe,
  Zap,
} from "lucide-react";

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role, isAuthenticated, loading: authLoading } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);

  const isRecruiter = role === "recruiter";

  // Compute deadline state after job loads
  const isDeadlinePassed = job?.deadline ? new Date(job.deadline) < new Date() : false;
  const daysUntilDeadline = job?.deadline
    ? Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isJobApproved = job?.status === "approved";
  const isJobClosed = job?.status === "closed" || isDeadlinePassed || !isJobApproved;
  const isOwner = job?.postedBy === user?.uid;
  const isAdmin = user?.role === "admin";

  // Auth guard — redirect to signin if not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/signin?redirect=/jobs/${id}`);
    }
  }, [authLoading, isAuthenticated, id, router]);

  // Fetch job details
  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        const res = await api.get(`/api/jobs/${id}`);
        setJob(res.data.data || res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (!isAuthenticated) { router.push("/signin"); return; }
    if (isRecruiter) { setShowRecruiterModal(true); return; }
    try {
      const res = await api.post(`/api/jobs/${id}/pre-apply-check`, { uid: user.uid });
      const data = res.data;
      if (data.allowed) {
        router.push(`/skill-gap-analysis/${id}`);
      } else if (data.redirectTo) {
        router.push(data.redirectTo);
      } else {
        setError(data.message || "Cannot apply at this time.");
      }
    } catch {
      router.push(`/skill-gap-analysis/${id}`);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) { router.push("/signin"); return; }
    try {
      const res = await api.post(`/api/jobs/${id}/save`, { uid: user.uid, email: user.email });
      if (res.status === 200 || res.data.success) {
        setSaved(true);
        setSaveMsg("Saved!");
        setTimeout(() => setSaveMsg(""), 2500);
      }
    } catch { /* ignore */ }
  };

  // Loading state — only while auth resolves. Guests deliberately get to
  // READ the job; apply/save handlers redirect signed-out users themselves.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Schema.org JobPosting — built ONLY from real job fields (live shapes:
  // company/location/salary are plain strings here). Optional fields are
  // dropped when absent rather than invented.
  const EMPLOYMENT_TYPE_MAP = {
    "full-time": "FULL_TIME",
    "part-time": "PART_TIME",
    contract: "CONTRACT",
    internship: "INTERNSHIP",
  };
  const jobJsonLd = job
    ? {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title || "",
        description:
          (job.description || "").slice(0, 4000) || job.title || "",
        datePosted: job.createdAt || job.postedAt || undefined,
        employmentType:
          EMPLOYMENT_TYPE_MAP[String(job.employmentType || "").toLowerCase()],
        hiringOrganization: {
          "@type": "Organization",
          name: job.company || "Unknown",
        },
        ...(job.location
          ? {
              jobLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: String(job.location),
                },
              },
            }
          : {}),
        directApply: true,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#fdfdfe]">
      <Navbar />

      <main className="pt-8 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {jobJsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(jobJsonLd).replace(/</g, "\\u003c"),
              }}
            />
          )}

          {/* Back */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8 group animate-slide-in-left"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Jobs
          </Link>

          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-slate-100 rounded-2xl w-2/3" />
              <div className="h-6 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-100 rounded-3xl mt-6" />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-medium text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          {!loading && !error && job && (
            <div className="animate-content-enter">
              {/* Hero card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-8 premium-shadow mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  {/* Logo */}
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0">
                    {job.logo ? (
                      <span className="text-2xl">{job.logo}</span>
                    ) : (
                      <Building2 className="w-7 h-7 text-indigo-600" />
                    )}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-500 text-sm font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" /> {job.company}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" /> {job.employmentType || job.type || "—"}
                      </span>
                      <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                        <DollarSign className="w-4 h-4" />
                        {job.salary || job.salaryRange || "Competitive"}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {(job.skills || job.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Deadline warning badge */}
                    {job.deadline && !isJobClosed && daysUntilDeadline !== null && daysUntilDeadline <= 7 && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-bold text-orange-600">
                          {daysUntilDeadline <= 0 ? "Deadline today!" : `${daysUntilDeadline} days left to apply`}
                        </span>
                      </div>
                    )}
                    
                    {!isJobApproved && (
                       <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                         <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                         <span className="text-xs font-bold text-amber-600 uppercase tracking-tight">
                           Awaiting Admin Approval
                         </span>
                       </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isJobClosed ? (
                      <button
                        disabled
                        className="px-6 py-3 bg-slate-100 text-slate-400 rounded-2xl font-bold text-sm cursor-not-allowed border border-slate-200"
                      >
                        {!isJobApproved ? "Pending Approval" : isDeadlinePassed ? "Deadline Passed" : "Applications Closed"}
                      </button>
                    ) : (
                      <button
                        onClick={handleApply}
                        disabled={isRecruiter}
                        className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                          isRecruiter
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                        }`}
                      >
                        Apply Now
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      className={`p-3 border rounded-2xl transition-colors btn-press hover-scale ${
                        saved
                          ? "border-amber-300 bg-amber-50 text-amber-500"
                          : "border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-400 hover:text-amber-500"
                      }`}
                      aria-label="Save job"
                    >
                      <Star className={`w-5 h-5 ${saved ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </div>
                </div>

                {saveMsg && (
                  <p className="mt-3 text-xs text-emerald-600 font-semibold animate-fade-in">{saveMsg}</p>
                )}
              </div>

              {/* Info chips row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
                {[
                  { icon: Clock,    label: "Experience",  value: job.experience || job.experienceLevel || "Not specified" },
                  { icon: Users,    label: "Vacancies",   value: job.vacancies ? `${job.vacancies} open` : "Not specified" },
                  { icon: Globe,    label: "Work Mode",   value: job.workMode || job.employmentType || "Not specified" },
                  { icon: Calendar, label: "Posted",      value: job.posted || (job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently") },
                  { icon: AlertCircle, label: "Deadline", value: job.deadline ? new Date(job.deadline).toLocaleDateString() : "Open-ended", highlight: isDeadlinePassed },
                  { icon: Briefcase, label: "Type",       value: job.employmentType || "Not specified" },
                ].map(({ icon: Icon, label, value, highlight }) => (
                  <div key={label} className={`bg-white rounded-2xl border p-4 premium-shadow animate-card-rise ${
                    highlight ? "border-red-200 bg-red-50" : "border-slate-100"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${highlight ? "text-red-500" : "text-indigo-500"}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        highlight ? "text-red-400" : "text-slate-400"
                      }`}>{label}</span>
                    </div>
                    <p className={`text-sm font-bold truncate ${
                      highlight ? "text-red-600" : "text-slate-800"
                    }`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Description */}
                  {(job.description || job.about) && (
                    <Section title="About the Role">
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                        {job.description || job.about}
                      </p>
                    </Section>
                  )}

                  {/* Responsibilities */}
                  {job.responsibilities?.length > 0 && (
                    <Section title="Responsibilities">
                      <ul className="space-y-2.5">
                        {job.responsibilities.map((r, i) => (
                          <BulletItem key={i} text={r} />
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* Requirements */}
                  {job.requirements?.length > 0 && (
                    <Section title="Requirements">
                      <ul className="space-y-2.5">
                        {job.requirements.map((r, i) => (
                          <BulletItem key={i} text={r} />
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* Nice to have */}
                  {job.niceToHave?.length > 0 && (
                    <Section title="Nice to Have">
                      <ul className="space-y-2.5">
                        {job.niceToHave.map((r, i) => (
                          <BulletItem key={i} text={r} color="text-violet-500" />
                        ))}
                      </ul>
                    </Section>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                  {/* Benefits */}
                  {job.benefits?.length > 0 && (
                    <Section title="Benefits">
                      <ul className="space-y-2">
                        {job.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* Skills */}
                  {(job.skills || job.tags || []).length > 0 && (
                    <Section title="Required Skills">
                      <div className="flex flex-wrap gap-2">
                        {(job.skills || job.tags || []).map((s) => (
                          <span key={s} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl">
                            {s}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Apply CTA */}
                  <div className={`rounded-2xl p-6 ${
                    isJobClosed
                      ? "bg-slate-100 border border-slate-200"
                      : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                  }`}>
                    <h3 className={`font-black text-base mb-1 ${isJobClosed ? "text-slate-500" : ""}`}>
                      {!isJobApproved ? "Pending Approval" : isJobClosed ? "Applications Closed" : "Ready to apply?"}
                    </h3>
                    <p className={`text-xs mb-4 ${isJobClosed ? "text-slate-400" : "text-indigo-200"}`}>
                      {!isJobApproved
                        ? "This job is currently being reviewed by our administrators."
                        : isJobClosed
                        ? (isDeadlinePassed ? `The application deadline was ${new Date(job.deadline).toLocaleDateString()}.` : "This job is no longer accepting applications.")
                        : (job.deadline ? `Deadline: ${new Date(job.deadline).toLocaleDateString()}` : "Submit your application and let AI match your skills.")
                      }
                    </p>
                    <button
                      onClick={handleApply}
                      disabled={isJobClosed || isRecruiter}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                        isJobClosed || isRecruiter
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white text-indigo-700 hover:bg-indigo-50 btn-press"
                      }`}
                    >
                      {isRecruiter ? "Candidates Only" : !isJobApproved ? "Pending Approval" : isJobClosed ? "Applications Closed" : "Apply Now"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Recruiter apply guard modal */}
      {showRecruiterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowRecruiterModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
            onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Recruiter Account Detected</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Applying to jobs requires a <span className="font-bold text-slate-700">candidate account</span>. Your current account is registered as a recruiter.
            </p>
            <div className="space-y-2">
              <a href="/signup?role=candidate"
                className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-colors">
                Create a Candidate Account
              </a>
              <button onClick={() => setShowRecruiterModal(false)}
                className="block w-full py-3 border border-slate-200 text-slate-500 font-semibold text-sm rounded-2xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 premium-shadow animate-card-rise">
      <h2 className="text-base font-black text-slate-900 mb-4 pb-3 border-b border-slate-50">
        {title}
      </h2>
      {children}
    </div>
  );
}

function BulletItem({ text, color = "text-emerald-500" }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-600">
      <CheckCircle className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
      {text}
    </li>
  );
}
