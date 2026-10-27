"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Clock, ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import PageWrapper from "../components/common/PageWrapper";

// Honest, low-friction contact path: the form opens the visitor's default
// email client addressed to the team inbox. No fake backend, no pretend
// "message sent" — if the mail app doesn't open, the address is shown so
// people can email directly.
const CONTACT_EMAIL = "support@jobmatchai.app";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const subject = encodeURIComponent(`SkillMatch AI — message from ${name || "a visitor"}`);
    const body = encodeURIComponent(
      `${message}\n\n—\n${name || ""}\n${email || ""}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    // The mail client hands off synchronously; surface the fallback address.
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fdfdfe]">
      <Navbar />

      <main className="pt-8 sm:pt-12 pb-24">
        <PageWrapper>
          {/* Hero */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="max-w-3xl animate-fade-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                We&apos;d love to <span className="text-indigo-600">hear from you.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl">
                Questions about your account, a job posting, or the platform?
                Drop us a message and we&apos;ll get back to you as soon as we can.
              </p>
            </div>
          </section>

          {/* Content */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Contact details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/20">
                      <Mail className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">Email us directly</h2>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                      Prefer your own email client? Write to us at any time —
                      we read every message.
                    </p>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-indigo-600" />
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />
                </div>

                <div className="bg-white border border-slate-100 premium-shadow rounded-3xl p-8 flex items-start gap-4">
                  <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Response time</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      We usually reply within 1–2 business days.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 premium-shadow rounded-3xl p-8 flex items-start gap-4">
                  <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Account help</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Include the email on your account (and the job ID, if
                      relevant) so we can help faster.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="lg:col-span-3 bg-white border border-slate-100 premium-shadow rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Send a message</h2>
                <p className="text-slate-500 text-sm mb-8">
                  Submitting opens your default email app with everything filled in.
                </p>

                {sent ? (
                  <div className="flex flex-col items-start gap-4 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center gap-3 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <p className="font-semibold text-sm">
                        Your email app should have opened with your message.
                      </p>
                    </div>
                    <p className="text-emerald-700/80 text-sm leading-relaxed">
                      If nothing opened, email us directly at{" "}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline underline-offset-2">
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                    <button
                      type="button"
                      onClick={() => setSent(false)}
                      className="text-sm font-semibold text-indigo-600 hover:underline underline-offset-4"
                    >
                      Write another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Your name
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          placeholder="Jane Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Email address
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={6}
                        placeholder="Tell us how we can help…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Opening email…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
