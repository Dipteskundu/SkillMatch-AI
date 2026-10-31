"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Shared tooltip style ──────────────────────────────────────────────────────
const TooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
    boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
  },
  cursor: { fill: "rgba(129,140,248,0.12)" },
};

// ── Candidate: Application Status Donut ──────────────────────────────────────
export function CandidateStatusChart({ stats }) {
  const data = [
    { name: "Applied",    value: Number(stats?.applied    || 0), color: "#6366f1" },
    { name: "Saved",      value: Number(stats?.saved      || 0), color: "#f59e0b" },
    { name: "Interviews", value: Number(stats?.interviews || 0), color: "#8b5cf6" },
    { name: "Tasks",      value: Number(stats?.pendingTasks || 0), color: "#10b981" },
  ].filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart label="No activity yet" />;

  return (
    <ChartCard title="Activity Breakdown">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
            paddingAngle={3} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={TooltipStyle.contentStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Candidate: Profile Completion Radial ─────────────────────────────────────
export function ProfileCompletionChart({ completion }) {
  const pct = Math.min(100, Math.max(0, Number(completion || 0)));
  const data = [{ name: "Profile", value: pct, fill: pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#6366f1" }];

  return (
    <ChartCard title="Profile Strength">
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={160}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
            startAngle={90} endAngle={-270} data={data} barSize={14}>
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--secondary)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900">{pct}%</span>
          <span className="text-xs text-slate-400 font-semibold">Complete</span>
        </div>
      </div>
    </ChartCard>
  );
}

// ── Recruiter: Pipeline Funnel Bar ───────────────────────────────────────────
export function RecruiterPipelineChart({ stats }) {
  const data = [
    { stage: "Applicants",  count: Number(stats?.totalApplicants || 0) },
    { stage: "Shortlisted", count: Number(stats?.shortlisted     || 0) },
    { stage: "Interviews",  count: Number(stats?.interviews      || 0) },
    { stage: "Active Jobs", count: Number(stats?.activeJobs      || 0) },
  ];

  const max = Math.max(...data.map(d => d.count), 1);
  if (data.every(d => d.count === 0)) return <EmptyChart label="No pipeline data yet" />;

  return (
    <ChartCard title="Hiring Pipeline">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="stage" tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip {...TooltipStyle} />
          <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={["#6366f1","#8b5cf6","#a78bfa","#10b981"][i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Recruiter: Applications over time (from jobs array) ──────────────────────
export function RecruiterJobsChart({ jobs = [] }) {
  if (!jobs.length) return <EmptyChart label="No jobs posted yet" />;

  const data = jobs.slice(0, 6).map(j => ({
    name: (j.title || "Job").slice(0, 12),
    applicants: j.applicantCount || 0,
  }));

  return (
    <ChartCard title="Applicants per Job">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={22} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip {...TooltipStyle} />
          <Bar dataKey="applicants" name="Applicants" fill="#6366f1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Admin: User Growth Area Chart ────────────────────────────────────────────
export function AdminGrowthChart({ growth = [] }) {
  if (!growth.length) {
    // Generate placeholder months if no data
    const months = ["Jan","Feb","Mar","Apr","May","Jun"];
    growth = months.map(m => ({ month: m, users: 0 }));
  }

  return (
    <ChartCard title="User Growth">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={growth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip {...TooltipStyle} />
          <Area type="monotone" dataKey="users" name="Users" stroke="#6366f1" strokeWidth={2.5}
            fill="url(#userGrad)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Admin: Platform Stats Donut ───────────────────────────────────────────────
export function AdminStatsChart({ stats }) {
  const data = [
    { name: "Users",        value: Number(stats?.totalUsers        || 0), color: "#6366f1" },
    { name: "Jobs",         value: Number(stats?.totalJobs         || 0), color: "#10b981" },
    { name: "Applications", value: Number(stats?.totalApplications || 0), color: "#f59e0b" },
    { name: "Companies",    value: Number(stats?.totalCompanies    || 0), color: "#8b5cf6" },
  ].filter(d => d.value > 0);

  if (!data.length) return <EmptyChart label="No platform data yet" />;

  return (
    <ChartCard title="Platform Overview">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={78}
            paddingAngle={3} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={TooltipStyle.contentStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Learning: Score trend over time (My Assessments overview) ────────────────
export function LearningScoreTrendChart({ attempts = [] }) {
  const data = attempts
    .filter(a => typeof a.score === "number")
    .sort((a, b) => new Date(a.startedAt || a.submittedAt) - new Date(b.startedAt || b.submittedAt))
    .slice(-20)
    .map(a => ({
      name: new Date(a.startedAt || a.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: a.score,
    }));

  if (!data.length) return <EmptyChart label="Take your first assessment" />;

  return (
    <ChartCard title="Score Trend">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip {...TooltipStyle} formatter={(v) => [`${v}%`, "Score"]} />
          <Area type="monotone" dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2.5}
            fill="url(#scoreGrad)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Learning: Topic-wise performance bars ────────────────────────────────────
export function LearningTopicChart({ topics = [] }) {
  const data = [...topics]
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
    .slice(0, 8)
    .map(t => ({ name: t.topic, percent: Number(t.percent) || 0 }));

  if (!data.length) return <EmptyChart label="No topic data yet" />;

  return (
    <ChartCard title="Topic Performance">
      <ResponsiveContainer width="100%" height={data.length > 5 ? 240 : 190}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip {...TooltipStyle} formatter={(v) => [`${v}%`, "Correct"]} />
          <Bar dataKey="percent" barSize={12} radius={[0, 6, 6, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.percent >= 60 ? "#10b981" : d.percent >= 40 ? "#f59e0b" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Learning: Course progress rings ──────────────────────────────────────────
export function LearningProgressRings({ plans = [] }) {
  const active = plans
    .filter(p => (p.progress?.percent ?? 0) < 100)
    .slice(0, 4);
  if (!active.length) return <EmptyChart label="No courses in progress" />;

  const colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#10b981"];
  const data = active.map((p, i) => ({
    name: (p.title || "Course").slice(0, 20),
    value: p.progress?.percent ?? 0,
    fill: colors[i % colors.length],
  }));

  return (
    <ChartCard title="Course Progress">
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart data={data} cx="50%" cy="50%" innerRadius="28%" outerRadius="92%"
          startAngle={90} endAngle={-270} barSize={13}>
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "var(--secondary)" }} />
          <Tooltip {...TooltipStyle} formatter={(v) => [`${v}%`, "Complete"]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
        </RadialBarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Learning: Weekly study activity ──────────────────────────────────────────
export function LearningActivityChart({ weekly = [] }) {
  if (!weekly.length || weekly.every(w => !w.lessons && !w.assessments)) {
    return <EmptyChart label="No study activity yet" />;
  }

  return (
    <ChartCard title="Weekly Study Activity">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weekly} barSize={12} margin={{ top: 4, right: 8, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip {...TooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
          <Bar dataKey="lessons" name="Lessons" fill="#6366f1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="assessments" name="Assessments" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Shared wrappers ───────────────────────────────────────────────────────────
function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-sm font-black text-slate-700 mb-3">{title}</p>
      {children}
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-center h-[200px]">
      <p className="text-xs text-slate-400 font-semibold">{label}</p>
    </div>
  );
}
