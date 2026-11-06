"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import api, { API_BASE } from "../../lib/apiClient";
import {
  Briefcase, MapPin, DollarSign, Users, Calendar, Code,
  FileText, AlignLeft, CheckCircle, AlertCircle, Loader2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"];
const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Lead", "Manager", "Director"];

export default function PostJobPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", company: "", location: "", salaryRange: "",
    experienceLevel: "", employmentType: "", skills: "",
    description: "", responsibilities: "", vacancies: "", deadline: "",
  });
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) { setMsg({ type: "error", text: "Not authenticated." }); return; }
    setPosting(true);
    setMsg(null);
    try {
      const res = await api.post("/api/jobs", {
        ...form,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        responsibilities: form.responsibilities.split("\n").map(r => r.trim()).filter(Boolean),
        vacancies: form.vacancies ? parseInt(form.vacancies, 10) : null,
        postedBy: user.uid,
      });
      const result = res.data;
      if (result.success) {
        setMsg({ type: "success", text: "Job posted successfully! Redirecting..." });
        setTimeout(() => router.push("/my-jobs"), 1500);
      } else {
        setMsg({ type: "error", text: result.message || "Failed to post job." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPosting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen theme-page-muted">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/my-jobs" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to My Jobs
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Post a New Job</h1>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the details below to attract the right candidates.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <Section icon={<Briefcase className="w-4 h-4 text-indigo-600" />} title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Job Title *">
                <input required type="text" placeholder="e.g. Senior React Developer" value={form.title}
                  onChange={e => set("title", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Company Name *">
                <input required type="text" placeholder="Your company name" value={form.company}
                  onChange={e => set("company", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Location *">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input required type="text" placeholder="e.g. Dhaka, Bangladesh / Remote" value={form.location}
                    onChange={e => set("location", e.target.value)} className={`${inputCls} pl-9`} />
                </div>
              </Field>
              <Field label="Salary Range">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="e.g. $60k – $80k" value={form.salaryRange}
                    onChange={e => set("salaryRange", e.target.value)} className={`${inputCls} pl-9`} />
                </div>
              </Field>
              <Field label="Employment Type">
                <select value={form.employmentType} onChange={e => set("employmentType", e.target.value)} className={inputCls}>
                  <option value="">Select type</option>
                  {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Experience Level">
                <select value={form.experienceLevel} onChange={e => set("experienceLevel", e.target.value)} className={inputCls}>
                  <option value="">Select level</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Vacancies">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" min="1" placeholder="Number of openings" value={form.vacancies}
                    onChange={e => set("vacancies", e.target.value)} className={`${inputCls} pl-9`} />
                </div>
              </Field>
              <Field label="Application Deadline">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="date" value={form.deadline}
                    onChange={e => set("deadline", e.target.value)} className={`${inputCls} pl-9`} />
                </div>
              </Field>
            </div>
          </Section>

          {/* Skills */}
          <Section icon={<Code className="w-4 h-4 text-indigo-600" />} title="Required Skills">
            <Field label="Skills (comma separated)">
              <input type="text" placeholder="e.g. React, Node.js, TypeScript, MongoDB" value={form.skills}
                onChange={e => set("skills", e.target.value)} className={inputCls} />
            </Field>
          </Section>

          {/* Description */}
          <Section icon={<AlignLeft className="w-4 h-4 text-indigo-600" />} title="Job Description">
            <Field label="Description *">
              <textarea required rows={5} placeholder="Describe the role, team, and what candidates will work on..."
                value={form.description} onChange={e => set("description", e.target.value)}
                className={`${inputCls} resize-y`} />
            </Field>
          </Section>

          {/* Responsibilities */}
          <Section icon={<FileText className="w-4 h-4 text-indigo-600" />} title="Responsibilities">
            <Field label="One responsibility per line">
              <textarea rows={5} placeholder={"- Build and maintain frontend components\n- Collaborate with design team\n- Participate in code reviews"}
                value={form.responsibilities} onChange={e => set("responsibilities", e.target.value)}
                className={`${inputCls} resize-y font-mono text-xs`} />
            </Field>
          </Section>

          {/* Alerts */}
          {msg && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold ${
              msg.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-600"
            }`}>
              {msg.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              {msg.text}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <button type="submit" disabled={posting}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-200 disabled:opacity-50">
              {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Briefcase className="w-5 h-5" /> Post Job</>}
            </button>
            <Link href="/my-jobs"
              className="px-8 py-3.5 border border-slate-200 bg-white rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300";

function Section({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="p-1.5 bg-indigo-50 rounded-lg">{icon}</div>
        <h2 className="font-black text-slate-900 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>}
      {children}
    </div>
  );
}
