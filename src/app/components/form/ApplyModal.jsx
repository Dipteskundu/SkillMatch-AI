"use client";

import { X, Send, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import api from "../../lib/apiClient";
import { usePreApplyCheckMutation } from "../../store/api/apiSlice";

/**
 * Real apply modal — used from the jobs list when a notification deep-link
 * (?applyJobId=) opens a job. Mirrors the canonical apply flow:
 *   1. POST /api/jobs/:jobId/pre-apply-check  (verification gate)
 *   2. POST /api/jobs/:jobId/apply            ({ uid, email, jobTitle, company })
 * No simulated submissions: success/error states reflect the actual API calls.
 */
export default function ApplyModal({ isOpen, onClose, jobId, jobTitle, companyName }) {
    const { user, isAuthenticated } = useAuth();
    const [preApplyCheck] = usePreApplyCheckMutation();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const [gate, setGate] = useState(null); // { message, redirectTo? } when verification blocks applying

    // Prevent scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Reset state whenever the modal is (re)opened
    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setError("");
            setGate(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setGate(null);

        if (!isAuthenticated || !user?.uid) {
            setError("You must be signed in to apply. Please sign in and try again.");
            return;
        }
        if (!jobId) {
            setError("This job could not be identified. Please reopen it from the jobs list.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Step 1: verification gate (same check the jobs page uses)
            const check = await preApplyCheck({ jobId, uid: user.uid }).unwrap();

            if (check?._serverError) {
                setError(check?.message || "Server error. Please try again later.");
                return;
            }

            if (!check?.allowed) {
                setGate({
                    message: check?.message || "Cannot apply at this time.",
                    redirectTo: check?.redirectTo || null,
                });
                return;
            }

            // Step 2: real application submission
            const res = await api.post(`/api/jobs/${jobId}/apply`, {
                uid: user.uid,
                email: user.email,
                jobTitle: jobTitle || "",
                company: companyName || "",
            });
            const data = res.data;

            if ((res.status === 200 || res.status === 201) && data?.success) {
                setIsSuccess(true);
            } else {
                setError(data?.message || "Application failed. Please try again.");
            }
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to submit application. Please try again.";
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in transition-all"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {isSuccess ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-bounce">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Application Sent!</h2>
                        <p className="text-slate-500 text-lg mb-6">
                            Your application for {jobTitle} has been submitted to {companyName}.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/applications"
                                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm"
                            >
                                Track My Applications
                            </Link>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-6 sm:px-8 py-6 sm:py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Apply for Position</h2>
                                <p className="text-indigo-600 font-bold text-xs sm:text-sm">
                                    {jobTitle} <span className="text-slate-400 font-medium px-1 sm:px-2">•</span> {companyName}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 sm:p-3 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900 shadow-sm"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6 sm:space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                            {/* Applying-as summary (from the signed-in account) */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Applying as</label>
                                <div className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="font-bold text-slate-900 text-sm">
                                        {user?.displayName || "Signed-in candidate"}
                                    </p>
                                    <p className="text-sm text-slate-400">{user?.email}</p>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            {gate && (
                                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-medium">
                                    <p className="flex items-start gap-2.5">
                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        {gate.message}
                                    </p>
                                    {gate.redirectTo && (
                                        <Link
                                            href={gate.redirectTo}
                                            className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors"
                                        >
                                            Complete Verification <Send className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            )}

                            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-700">
                                <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium leading-relaxed">
                                    By applying, you agree to share your profile and contact information with {companyName}. We recommend double-checking your résumé for the latest updates.
                                </p>
                            </div>

                            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 sm:py-5 bg-slate-900 text-white rounded-xl sm:rounded-[1.5rem] font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 text-sm sm:text-base"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Application <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 sm:px-10 py-4 sm:py-5 border border-slate-200 rounded-xl sm:rounded-[1.5rem] font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
