"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Home, Sun, Moon, Menu, Briefcase, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import Avatar from "../common/Avatar";
import PageTransition from "../common/PageTransition";
import DashboardSidebar from "../../dashboard/components/DashboardSidebar";
import NotificationPanel from "../Notifications/NotificationPanel";
import { useAppSelector } from "../../store/hooks";
import { selectUnreadCount } from "../../store/notificationsSlice";

export default function DashboardLayout({ children }) {
  const { user, userProfile, role: contextRole, isAuthenticated, loading: authLoading } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  // Shared, app-wide polling lives in NotificationSync; the badge just reads
  // the unread count from the notifications slice.
  const unreadCount = useAppSelector(selectUnreadCount);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  const role = contextRole || "candidate";
  const firstName = (userProfile?.displayName || user?.displayName || "there").split(" ")[0];

  // Show spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Don't render layout if not authenticated (redirect is in progress)
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar
        role={role}
        unreadCount={unreadCount}
        onNotifClick={() => setNotifOpen(true)}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0 animate-header-slide-down">
          {/* Mobile pill */}
          <div className="lg:hidden flex items-center justify-between w-full bg-slate-100 rounded-2xl px-4 py-2.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-600 hover:text-slate-900 transition-colors hover-scale btn-press"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-sm font-black text-slate-900 tracking-tight">
                SkillMatch<span style={{ color: "#6452F5" }}> AI</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="text-slate-500 hover:text-slate-900 transition-colors hover-scale btn-press" aria-label="Toggle theme">
                {mounted ? (theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />) : <Sun className="w-5 h-5" />}
              </button>
              <button onClick={() => setNotifOpen(true)} className="relative text-slate-500 hover:text-slate-900 transition-colors hover-scale btn-press" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white notif-badge" />}
              </button>
              <Link href="/profile" aria-label="My Profile" className="relative block hover-scale">
                <div className="w-9 h-9 rounded-full p-0.5" style={{ background: "linear-gradient(135deg, #6452F5, #a78bfa)" }}>
                  <Avatar src={user?.photoURL} size="w-full h-full" ring={false} />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </Link>
            </div>
          </div>

          {/* Desktop top bar */}
          <div className="hidden lg:flex items-center gap-3 w-full animate-slide-down">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0 hover-scale">
                <Avatar src={user?.photoURL} size="w-9 h-9" ring={true} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
                  Welcome back, {firstName}
                </h1>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors hover-scale btn-press" aria-label="Back to home">
                <Home className="w-[18px] h-[18px]" />
              </Link>
              <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors hover-scale btn-press" aria-label="Toggle theme">
                {mounted ? (theme === "dark" ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />) : <Sun className="w-[18px] h-[18px]" />}
              </button>
              <button onClick={() => setNotifOpen(true)} className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors hover-scale btn-press" aria-label="Notifications">
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white notif-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <span className="w-px h-6 bg-slate-200 mx-1" />
              {role === "candidate" && (
                <Link href="/jobs" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 rounded-xl font-semibold text-sm py-2 hover:bg-indigo-700 transition-colors hover-lift btn-press">
                  <Briefcase className="w-4 h-4" />
                  Find Jobs
                </Link>
              )}
              {role === "recruiter" && (
                <Link href="/post-job" className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 rounded-xl font-semibold text-sm py-2 hover:bg-blue-700 transition-colors hover-lift btn-press">
                  <Users className="w-4 h-4" />
                  Post Job
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto smooth-scroll px-4 py-4 lg:px-6 lg:py-6">
          <PageTransition>
            {children}
          </PageTransition>
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
