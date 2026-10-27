"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { User, Briefcase, Shield, Users, AlertCircle, Loader2, Menu, Bell, Home, Sun, Moon } from "lucide-react";
import Link from "next/link";
import Avatar from "../components/common/Avatar";
import CandidateDashboard from "./components/CandidateDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import AdminDashboard from "./components/AdminDashboard";
import DashboardSidebar from "./components/DashboardSidebar";
import NotificationPanel from "../components/Notifications/NotificationPanel";
import api from "../lib/apiClient";
import { useTheme } from "../lib/ThemeContext";
import { useAppSelector } from "../store/hooks";
import { selectUnreadCount } from "../store/notificationsSlice";

const ROLE_CONFIG = {
    candidate: {
        label: "Candidate",
        color: "text-indigo-700",
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        icon: Briefcase,
    },
    recruiter: {
        label: "Recruiter",
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: Users,
    },
    admin: {
        label: "Admin",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Shield,
    },
};

export default function Dashboard() {
    const { user, userProfile, role, isAuthenticated, loading: authLoading } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifOpen, setNotifOpen] = useState(false);
    // Shared, app-wide polling lives in NotificationSync; the badge just
    // reads the unread count from the notifications slice.
    const unreadCount = useAppSelector(selectUnreadCount);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { theme, toggleTheme, mounted } = useTheme();

    useEffect(() => {
        if (authLoading || !user?.uid || !role) return;

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                let dashUrl = "";
                if (role === "candidate") dashUrl = `/api/dashboard/candidate/${user.uid}`;
                else if (role === "recruiter") dashUrl = `/api/dashboard/recruiter/${user.uid}`;
                else if (role === "admin") dashUrl = `/api/dashboard/admin`;

                if (dashUrl) {
                    const dashRes = await api.get(dashUrl);
                    setDashboardData(dashRes.data.data || null);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("Could not load dashboard data. The backend may be offline.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.uid, role, authLoading]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <User className="w-7 h-7 text-red-500" aria-hidden="true" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Sign in required</h1>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        You need to be signed in to access your dashboard.
                    </p>
                    <Link
                        href="/signin"
                        className="block w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.candidate;
    const RoleIcon = roleConfig.icon;
    const firstName = (userProfile?.displayName || user?.displayName || "there").split(" ")[0];

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar — passes open state on mobile */}
            <DashboardSidebar
                role={role}
                unreadCount={unreadCount}
                onNotifClick={() => setNotifOpen(true)}
                mobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0">
                    {/* Mobile navbar — pill design */}
                    <div className="lg:hidden flex items-center justify-between w-full bg-slate-100 rounded-2xl px-4 py-2.5">
                        {/* Hamburger + App name */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="text-slate-600 hover:text-slate-900 transition-colors"
                                aria-label="Open sidebar"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-black text-slate-900 tracking-tight">
                                SkillMatch<span style={{ color: "#6452F5" }}> AI</span>
                            </span>
                        </div>

                        {/* Right icons */}
                        <div className="flex items-center gap-4">
                            {/* Theme toggle */}
                            <button
                                onClick={toggleTheme}
                                className="text-slate-500 hover:text-slate-900 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {mounted ? (
                                    theme === "dark"
                                        ? <Moon className="w-5 h-5" aria-hidden="true" />
                                        : <Sun className="w-5 h-5" aria-hidden="true" />
                                ) : <Sun className="w-5 h-5" aria-hidden="true" />}
                            </button>

                            {/* Notifications */}
                            <button
                                onClick={() => setNotifOpen(true)}
                                className="relative text-slate-500 hover:text-slate-900 transition-colors"
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5" aria-hidden="true" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                                )}
                            </button>

                            {/* Avatar with purple ring + green dot */}
                            <Link href="/profile" aria-label="My Profile" className="relative block">
                                <div className="w-9 h-9 rounded-full p-0.5" style={{ background: "linear-gradient(135deg, #6452F5, #a78bfa)" }}>
                                    <Avatar src={user?.photoURL} size="w-full h-full" ring={false} />
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" aria-label="Online" />
                            </Link>
                        </div>
                    </div>

                    {/* Desktop top bar */}
                    <div className="hidden lg:flex items-center gap-3 w-full">
                        {/* User info */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="relative shrink-0">
                                <Avatar src={user?.photoURL} size="w-9 h-9" ring={true} />
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" aria-label="Online" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
                                    Welcome back, {firstName}
                                </h1>
                                <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}>
                                        <RoleIcon className="w-2.5 h-2.5" aria-hidden="true" />
                                        {roleConfig.label}
                                    </span>
                                    <span className="text-xs text-slate-400 truncate">{user?.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right side icons */}
                        <div className="shrink-0 flex items-center gap-1.5">
                            <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Back to home" title="Back to Home">
                                <Home className="w-[18px] h-[18px]" aria-hidden="true" />
                            </Link>
                            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Toggle theme">
                                {mounted ? (
                                    theme === "dark"
                                        ? <Moon className="w-[18px] h-[18px]" aria-hidden="true" />
                                        : <Sun className="w-[18px] h-[18px]" aria-hidden="true" />
                                ) : <Sun className="w-[18px] h-[18px]" aria-hidden="true" />}
                            </button>
                            <button onClick={() => setNotifOpen(true)} className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Notifications" title="Notifications">
                                <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>
                            <span className="w-px h-6 bg-slate-200 mx-1" aria-hidden="true" />
                            {role === "candidate" && (
                                <Link href="/jobs" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 rounded-xl font-semibold text-sm py-2 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                    <Briefcase className="w-4 h-4" aria-hidden="true" />
                                    Find Jobs
                                </Link>
                            )}
                            {role === "recruiter" && (
                                <Link href="/post-job" className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 rounded-xl font-semibold text-sm py-2 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                    <Users className="w-4 h-4" aria-hidden="true" />
                                    Post Job
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6" aria-label="Dashboard content">
                    {error && !loading && (
                        <div role="alert" className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium animate-slide-in">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-20" aria-live="polite" aria-label="Loading dashboard">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" aria-hidden="true" />
                            <span className="ml-3 text-slate-500 font-medium">Loading your dashboard...</span>
                        </div>
                    )}

                    {!loading && (
                        <div className="animate-fade-up">
                            {role === "candidate" && (
                                <CandidateDashboard user={user} data={dashboardData} loading={loading} />
                            )}
                            {role === "recruiter" && (
                                <RecruiterDashboard user={user} data={dashboardData} loading={loading} />
                            )}
                            {role === "admin" && (
                                <AdminDashboard user={user} data={dashboardData} loading={loading} />
                            )}
                        </div>
                    )}
                </main>
            </div>

            <NotificationPanel
                uid={user?.uid}
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
            />
        </div>
    );
}
