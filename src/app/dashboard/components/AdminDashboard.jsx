"use client";

import { useState } from "react";
import {
    Users, Briefcase, TrendingUp, Building2,
    ShieldCheck, ShieldX, ChevronRight, BarChart2,
    AlertTriangle, CheckCircle, Search
} from "lucide-react";
import Skeleton from "../../components/common/Skeleton";
import { useScrollReveal } from "../../lib/useScrollReveal";
import { AdminGrowthChart, AdminStatsChart } from "./DashboardCharts";
import api, { API_BASE } from "../../lib/apiClient";

function StatCard({ label, value, icon: Icon, color, bg }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className={`${bg} ${color} p-3 rounded-xl shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function AdminDashboard({ user, data, loading }) {
    const [searchUser, setSearchUser] = useState("");
    const [actionMsg, setActionMsg] = useState(null);
    const revealRef = useScrollReveal();

    const stats = [
        { label: "Total Users",       value: data?.stats?.totalUsers        ?? "\u2014", icon: Users,     color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Active Jobs",       value: data?.stats?.totalJobs         ?? "\u2014", icon: Briefcase, color: "text-blue-600",   bg: "bg-blue-50" },
        { label: "Applications",      value: data?.stats?.totalApplications ?? "\u2014", icon: TrendingUp,color: "text-emerald-600",bg: "bg-emerald-50" },
        { label: "Companies",         value: data?.stats?.totalCompanies    ?? "\u2014", icon: Building2, color: "text-amber-600",  bg: "bg-amber-50" },
    ];

    if (loading) {
        return (
            <div className="space-y-6" aria-busy="true" aria-label="Loading admin dashboard">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
                            <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                            <Skeleton className="h-7 w-16 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-3">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                    </div>
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    const filteredUsers = (data?.recentUsers || []).filter(u =>
        u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchUser.toLowerCase())
    );

    const handleUserAction = (uid, action) => {
        setActionMsg({ uid, action });
        setTimeout(() => setActionMsg(null), 3000);
    };

    const handleJobAction = async (jobId, action) => {
        try {
            let res;
            if (action === "approve") {
                res = await api.put(`/api/admin/jobs/${jobId}/approve`);
            } else if (action === "reject") {
                res = await api.put(`/api/admin/jobs/${jobId}/reject`);
            } else if (action === "delete") {
                res = await api.delete(`/api/admin/jobs/${jobId}`);
            }
 
            const result = res.data;

            if (result.success) {
                setActionMsg({ jobId, action });
                setTimeout(() => setActionMsg(null), 3000);
                // Refresh data if possible or update local state
                // Since data is passed as prop, we might need to tell parent to refresh
                // For now, localized message is enough, user can refresh or we skip manual update
                window.location.reload(); 
            } else {
                alert(result.message || "Action failed");
            }
        } catch (error) {
            console.error("Job action error:", error);
            alert("An error occurred");
        }
    };

    const growthData = data?.growth || [];
    const maxUsers = Math.max(1, ...growthData.map(d => d.users));

    const ROLE_BADGE = {
        admin:     "bg-amber-100 text-amber-700",
        recruiter: "bg-blue-100 text-blue-700",
        candidate: "bg-indigo-100 text-indigo-700",
    };

    return (
        <div className="space-y-8" ref={revealRef}>

            {/* Toast */}
            {actionMsg && (
                <div
                    role="alert"
                    aria-live="polite"
                    className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg font-semibold text-sm text-white ${actionMsg.action === "ban" || actionMsg.action === "reject" || actionMsg.action === "delete" ? "bg-red-600" : "bg-emerald-600"}`}
                >
                    {actionMsg.jobId ? `Job ${actionMsg.action}d successfully.` : `User ${actionMsg.action === "ban" ? "banned" : "activated"} successfully.`}
                </div>
            )}

            {/* Admin Banner */}
            <div className="reveal bg-slate-900 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Admin Control Panel</span>
                    </div>
                    <h2 className="text-white font-bold text-lg">Platform Overview</h2>
                    <p className="text-slate-400 text-sm mt-0.5">Full visibility and control of the JobMatch AI platform.</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-semibold shrink-0">
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    Platform Online
                </div>
            </div>

            {/* Stats */}
            <section aria-label="Platform stats" className="reveal delay-100">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(s => <StatCard key={s.label} {...s} />)}
                </div>
            </section>

            {/* Charts */}
            <section aria-label="Platform charts" className="reveal delay-75">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AdminGrowthChart growth={data?.growth} />
                    <AdminStatsChart stats={data?.stats} />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* User Management */}
                    <section aria-labelledby="users-heading">
                        <h2 id="users-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                            User Management
                        </h2>

                        <div className="relative mb-3">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder="Search by name or email..."
                                value={searchUser}
                                onChange={e => setSearchUser(e.target.value)}
                                aria-label="Search users"
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                            />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            {filteredUsers.length > 0 ? (
                                <ul role="list" className="divide-y divide-slate-100">
                                    {filteredUsers.map((u, i) => (
                                        <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${ROLE_BADGE[u.role] || "bg-slate-100 text-slate-500"}`} aria-hidden="true">
                                                    {(u.displayName?.[0] || u.email?.[0] || "?").toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 text-sm truncate">{u.displayName || "Unnamed User"}</p>
                                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                                    <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${ROLE_BADGE[u.role] || "bg-slate-100 text-slate-600"}`}>
                                                        {u.role}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleUserAction(u.firebaseUid, "activate")}
                                                    disabled={u.role === "admin"}
                                                    aria-label={`Activate ${u.displayName || u.email}`}
                                                    className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Activate
                                                </button>
                                                <button
                                                    onClick={() => handleUserAction(u.firebaseUid, "ban")}
                                                    disabled={u.role === "admin"}
                                                    aria-label={`Ban ${u.displayName || u.email}`}
                                                    className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <ShieldX className="w-3.5 h-3.5" aria-hidden="true" /> Ban
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-12 text-center">
                                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                                    <p className="text-slate-500 text-sm font-medium">
                                        {data?.recentUsers?.length === 0 ? "No users found." : "No users match your search."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Pending Approvals Link */}
                        <a href="/admin/pending-approvals" className="bg-white rounded-2xl border border-emerald-200 p-5 hover:-translate-y-1 transition-transform group flex flex-col justify-between h-32 premium-shadow block">
                            <div>
                                <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2" />
                                <h3 className="font-bold text-slate-900">Pending Approvals</h3>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-emerald-600">{data?.pendingJobs?.length || 0} tasks</span>
                                <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                            </div>
                        </a>

                        {/* Deletion Requests Link */}
                        <a href="/admin/deletion-requests" className="bg-white rounded-2xl border border-amber-200 p-5 hover:-translate-y-1 transition-transform group flex flex-col justify-between h-32 premium-shadow block">
                            <div>
                                <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
                                <h3 className="font-bold text-slate-900">Deletion Requests</h3>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-amber-600">{data?.deleteRequests?.length || 0} reviews</span>
                                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
                            </div>
                        </a>

                        {/* Approved Jobs Link */}
                        <a href="/admin/approved-jobs" className="bg-white rounded-2xl border border-blue-200 p-5 hover:-translate-y-1 transition-transform group flex flex-col justify-between h-32 premium-shadow block">
                            <div>
                                <Briefcase className="w-6 h-6 text-blue-500 mb-2" />
                                <h3 className="font-bold text-slate-900">Approved Jobs</h3>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-blue-600">Active Directory</span>
                                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                        </a>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="space-y-5" aria-label="Admin tools">

                    {/* Growth Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2 text-sm">
                            <BarChart2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                            Platform Growth
                        </h3>
                        {growthData.length === 0 ? (
                            <p className="h-28 flex items-center justify-center text-xs text-slate-400 text-center">
                                Not enough activity yet — charts appear once there are dated signups and jobs to chart.
                            </p>
                        ) : (
                        <div className="flex items-end justify-between gap-1.5 h-28" role="img" aria-label="Monthly user growth chart">
                            {growthData.map(({ month, users }) => (
                                <div key={month} className="flex flex-col items-center gap-1 flex-1">
                                    <div
                                        className="w-full bg-indigo-500 rounded-t-lg hover:bg-indigo-600 transition-colors relative group cursor-default"
                                        style={{ height: `${(users / maxUsers) * 100}%` }}
                                        title={`${month}: ${users} users`}
                                    >
                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {users}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400">{month}</span>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>

                    {/* Fraud & abuse review — honest state (no automated fraud
                        detection runs today; never show invented alerts) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                            Fraud &amp; Abuse Review
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            No automated fraud detection is running at this time. User reports and
                            moderation flags will be listed here once moderation tooling ships.
                            Admins review flagged jobs and accounts manually via the jobs queue.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">Quick Actions</h3>
                        <nav aria-label="Admin quick actions">
                            <ul className="space-y-1">
                                {[
                                    { label: "View All Users",     href: "/admin/users" },
                                    { label: "Manage Job Posts",   href: "/admin/pending-approvals" },
                                    { label: "Bias & Fairness",    href: "/admin/bias-metrics" },
                                    { label: "Public API Keys",    href: "/admin/api-keys" },
                                ].map(({ label, href }) => (
                                    <li key={label}>
                                        <a
                                            href={href}
                                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 group"
                                        >
                                            {label}
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" aria-hidden="true" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </aside>
            </div>
        </div>
    );
}
