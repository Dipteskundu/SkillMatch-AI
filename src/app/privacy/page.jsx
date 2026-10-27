"use client";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Link from "next/link";
import { Shield, Lock, Eye, FileText, Bell, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Introduction",
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      content: "Welcome to SkillMatch AI. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you."
    },
    {
      title: "Information We Collect",
      icon: <Eye className="w-5 h-5 text-indigo-600" />,
      content: "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows: Identity Data (name, username), Contact Data (email, phone), Technical Data (IP address, browser type), Profile Data (preferences, feedback), and Usage Data (how you use our website)."
    },
    {
      title: "How We Use Your Data",
      icon: <Shield className="w-5 h-5 text-indigo-600" />,
      content: "We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to provide the services you requested, to manage your account, to improve our platform, and to communicate with you regarding updates."
    },
    {
      title: "Data Security",
      icon: <Lock className="w-5 h-5 text-indigo-600" />,
      content: "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data to those employees and third parties who have a business need to know."
    },
    {
      title: "Your Legal Rights",
      icon: <Bell className="w-5 h-5 text-indigo-600" />,
      content: "Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, or to object to processing."
    },
    {
      title: "Contact Us",
      icon: <Mail className="w-5 h-5 text-indigo-600" />,
      content: <>If you have any questions about this privacy policy or our privacy practices, please <Link href="/contact" className="text-indigo-600 font-semibold hover:underline">contact us</Link>.</>
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Trust & Security</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
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

          <div className="mt-12 p-8 bg-slate-50 border border-slate-100 rounded-3xl text-center">
            <p className="text-slate-500 text-sm mb-0">
              By using SkillMatch AI, you agree to the collection and use of information in accordance with this policy.
              Review our <a href="/terms" className="text-indigo-600 font-semibold hover:underline">Terms of Service</a> for more details.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
