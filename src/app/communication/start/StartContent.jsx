"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, AlertCircle, MessageSquare } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../lib/AuthContext";

export default function StartContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const jobId = searchParams.get("jobId") || "";
  const jobTitle = searchParams.get("jobTitle") || "";
  const company = searchParams.get("company") || "";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleStart = () => {
    if (!jobId) return;
    const nextParams = new URLSearchParams();
    nextParams.set("jobId", jobId);
    if (jobTitle) nextParams.set("jobTitle", jobTitle);
    if (company) nextParams.set("company", company);
    router.push(`/communication/test?${nextParams.toString()}`);
  };

  const titleText = jobTitle ? jobTitle : "this role";
  const companyText = company ? ` at ${company}` : "";

  return (
    <div className="min-h-screen theme-page">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 lg:px-24 max-w-2xl">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 premium-shadow p-10 sm:p-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Communication Test
              </h1>
            </div>

            <p className="text-slate-600 font-medium mb-8 leading-relaxed">
              You are about to begin a short communication assessment for{" "}
              <span className="font-black text-slate-900">{titleText}</span>
              {companyText}. Your answers will be analyzed by our AI and saved
              to your profile.
            </p>

            {!jobId && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                Missing job details. Please start from the jobs page.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleStart}
                disabled={!jobId}
                className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Begin Test <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="/jobs"
                className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
