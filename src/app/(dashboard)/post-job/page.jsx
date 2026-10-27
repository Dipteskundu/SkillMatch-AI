"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import api from "../../lib/apiClient";
import { mergeChips, removeChip, linesToList, listToLines, suggestSkills } from "../../lib/jobDraft";
import {
  Briefcase, MapPin, DollarSign, Users, Calendar, Code,
  FileText, AlignLeft, CheckCircle, AlertCircle, Loader2, ArrowLeft,
  Sparkles, X, Plus, ListChecks,
} from "lucide-react";
import Link from "next/link";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"];
const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Lead", "Manager", "Director"];

export default function PostJobPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", company: "", location: "", salaryRange: "",
    experienceLevel: "", employmentType: "",
    description: "", responsibilities: "", requirements: "",
    vacancies: "", deadline: "",
  });
  const [skills, setSkills] = useState([]);          // required-skill chips
  const [niceToHave, setNiceToHave] = useState([]);  // nice-to-have chips
  const [suggestions, setSuggestions] = useState([]); // AI-proposed skills to add
  const [posting, setPosting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState(false);
  const [msg, setMsg] = useState(null);
  const [genMsg, setGenMsg] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  /* ── AI draft ─────────────────────────────────────────── */
  const handleGenerateDraft = async () => {
    if (generating) return;
    if (!user?.uid) { setGenMsg({ type: "error", text: "Not authenticated." }); return; }
    if (!form.title.trim()) {
      setGenMsg({ type: "error", text: "Add a job title first — the draft is built from it." });
      return;
    }

    setGenerating(true);
    setGenMsg(null);
    try {
      const res = await api.post("/api/jobs/generate-draft", {
        uid: user.uid,
        title: form.title.trim(),
        ...(skills.length ? { skills } : {}),
        ...(form.experienceLevel ? { seniority: form.experienceLevel } : {}),
      });
      const payload = res?.data;
      const draft = payload?.data;

      if (!payload?.success || !draft) {
        setGenMsg({ type: "error", text: payload?.message || "AI draft failed. Please try again." });
        return;
      }

      setForm(f => ({
        ...f,
        description: draft.description || f.description,
        responsibilities: listToLines(draft.responsibilities) || f.responsibilities,
        requirements: listToLines(draft.requirements) || f.requirements,
      }));
      const proposed = Array.isArray(draft.niceToHaveSkills)
        ? draft.niceToHaveSkills
        : Array.isArray(draft.niceToHave)
          ? draft.niceToHave
          : [];

      if (proposed.length) setNiceToHave(prev => mergeChips(prev, proposed));

      // Suggested chips = generated nice-to-have skills + skills named in the
      // requirements, minus what the required-skills input already holds.
      setSuggestions(suggestSkills({
        niceToHave: proposed,
        requirements: draft.requirements || [],
        exclude: skills,
      }));
      setAiDraft(true);
    } catch (err) {
      // apiClient resolves HTTP 500s, so anything here is a real transport /
      // 4xx problem — say exactly what happened instead of blaming the AI.
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      if (status === 404) {
        setGenMsg({ type: "error", text: "AI draft generation isn't available on this server yet." });
      } else if (status === 429) {
        setGenMsg({ type: "error", text: serverMsg || "Too many AI requests — wait a few minutes and try again." });
      } else if (status === 403) {
        setGenMsg({ type: "error", text: serverMsg || "Only recruiter accounts can generate drafts." });
      } else if (status) {
        setGenMsg({ type: "error", text: serverMsg || "AI draft failed. Please try again." });
      } else {
        setGenMsg({ type: "error", text: "Couldn't reach the server. Check your connection and try again." });
      }
    } finally {
      setGenerating(false);
    }
  };

  const addSuggestedSkill = (skill) => {
    setSkills(prev => mergeChips(prev, [skill]));
    setSuggestions(prev => removeChip(prev, skill));
  };

  /* ── Submit ───────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) { setMsg({ type: "error", text: "Not authenticated." }); return; }
    setPosting(true);
    setMsg(null);
    try {
      const res = await api.post("/api/jobs", {
        ...form,
        skills,
        responsibilities: linesToList(form.responsibilities),
        requirements: linesToList(form.requirements),
        niceToHaveSkills: niceToHave,
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
    <div className="min-h-screen bg-[#f4f6fb]">
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

          {/* Skills (chips) */}
          <Section icon={<Code className="w-4 h-4 text-indigo-600" />} title="Required Skills">
            <Field label="Add skills — press Enter or comma">
              <ChipField
                values={skills}
                onChange={setSkills}
                placeholder="e.g. React, Node.js, TypeScript, MongoDB"
              />
            </Field>

            {suggestions.length > 0 && (
              <Field label="Suggested by AI — click to add to required skills">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(skill => (
                    <button
                      key={skill.toLowerCase()}
                      type="button"
                      onClick={() => addSuggestedSkill(skill)}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-100"
                    >
                      <Plus className="w-3 h-3" /> {skill}
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </Section>

          {/* Description + AI draft */}
          <Section
            icon={<AlignLeft className="w-4 h-4 text-indigo-600" />}
            title="Job Description"
            action={
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 transition-all hover:bg-indigo-100 hover:border-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Generate with AI</>}
              </button>
            }
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses the title, skills and experience level above. Every field stays editable.
              </p>
              {aiDraft && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                  <Sparkles className="w-3 h-3" /> AI draft — review before posting
                </span>
              )}
            </div>

            {genMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
                genMsg.type === "success"
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                  : "bg-red-50 border border-red-100 text-red-600"
              }`}>
                {genMsg.type === "success"
                  ? <CheckCircle className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {genMsg.text}
              </div>
            )}

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

          {/* Requirements + nice-to-have */}
          <Section icon={<ListChecks className="w-4 h-4 text-indigo-600" />} title="Requirements & Nice to Have">
            <Field label="One requirement per line">
              <textarea rows={4} placeholder={"- Hands-on experience with React\n- 3+ years building web applications\n- Familiarity with MongoDB"}
                value={form.requirements} onChange={e => set("requirements", e.target.value)}
                className={`${inputCls} resize-y font-mono text-xs`} />
            </Field>
            <Field label="Nice-to-have skills (optional)">
              <ChipField
                values={niceToHave}
                onChange={setNiceToHave}
                placeholder="e.g. GraphQL, Docker, Figma"
              />
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

function Section({ icon, title, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 rounded-lg">{icon}</div>
          <h2 className="font-black text-slate-900 text-sm">{title}</h2>
        </div>
        {action}
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

/** Chip input: Enter/comma adds, × (or Backspace on empty input) removes. */
function ChipField({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    if (!draft.trim()) return;
    onChange(mergeChips(values, [draft]));
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(removeChip(values, values[values.length - 1]));
    }
  };

  return (
    <div className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
      <div className="flex flex-wrap items-center gap-2">
        {values.map(value => (
          <span
            key={value.toLowerCase()}
            className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-700"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(removeChip(values, value))}
              aria-label={`Remove ${value}`}
              className="w-4 h-4 inline-flex items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={values.length ? "Add another…" : placeholder}
          aria-label="Add a skill"
          className="flex-1 min-w-[9rem] bg-transparent border-0 outline-none py-1 text-sm font-medium text-slate-900 placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}
