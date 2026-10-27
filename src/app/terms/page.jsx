"use client";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Link from "next/link";
import { Scale, CheckCircle, AlertTriangle, HelpCircle, FileCheck, Info } from "lucide-react";

export default function TermsOfServicePage() {
    const sections = [
        {
            title: "1. Acceptance of Terms",
            icon: <FileCheck className="w-5 h-5 text-indigo-600" />,
            content: "By accessing or using SkillMatch AI, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
        },
        {
            title: "2. Use of the Service",
            icon: <Info className="w-5 h-5 text-indigo-600" />,
            content: "SkillMatch AI provides job matching, skill assessments and related hiring tools for your personal, non-commercial use in connection with finding or filling roles. You may not resell, scrape, or misuse the service or its content."
        },
        {
            title: "3. User Accounts",
            icon: <CheckCircle className="w-5 h-5 text-indigo-600" />,
            content: "To use certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
        },
        {
            title: "4. Prohibited Content",
            icon: <AlertTriangle className="w-5 h-5 text-indigo-600" />,
            content: "Users may not post content that is unlawful, offensive, threatening, libelous, defamatory, or otherwise objectionable. We reserve the right to remove any content that violates these terms."
        },
        {
            title: "5. Limitation of Liability",
            icon: <Scale className="w-5 h-5 text-indigo-600" />,
            content: "In no event shall SkillMatch AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the service."
        },
        {
            title: "6. Support & Contact",
            icon: <HelpCircle className="w-5 h-5 text-indigo-600" />,
            content: <>If you have any questions about these Terms, please <Link href="/contact" className="text-indigo-600 font-semibold hover:underline">contact us</Link>.</>
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 mb-6">
                            <Scale className="w-4 h-4 text-slate-600" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Legal Framework</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Terms of Service</h1>
                        <p className="text-slate-500 text-lg">Last updated: October 2026</p>
                    </div>

                    <div className="premium-shadow border border-slate-100 rounded-3xl overflow-hidden bg-white">
                        <div className="p-8 md:p-12 space-y-12">
                            {sections.map((section, idx) => (
                                <section key={idx} className="relative">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                            {section.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
                                            <p className="text-slate-600 leading-relaxed text-[15px]">
                                                {section.content}
                                            </p>
                                        </div>
                                    </div>
                                    {idx !== sections.length - 1 && (
                                        <div className="absolute -bottom-6 left-0 right-0 h-px bg-slate-50" />
                                    )}
                                </section>
                            ))}
                        </div>
                    </div>


                </div>
            </main>

            <Footer />
        </div>
    );
}
