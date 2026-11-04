"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import Avatar from "../../components/common/Avatar";
import {
  LayoutDashboard, Briefcase, Bookmark, FileText, User, Settings,
  LogOut, Users, Clock, Building, Zap, Shield, ChevronLeft, ShieldCheck, AlertTriangle,
  ChevronRight, BarChart2, Search, X, Home, Star, CheckCircle2, UserCheck, AlignJustify,
  CalendarDays, Plus, Target,
} from "lucide-react";

const NAV_BY_ROLE = {
  candidate: [
    { label: "Overview",        href: "/dashboard",                icon: LayoutDashboard },
    { label: "Find Jobs",       href: "/jobs",                     icon: Search },
    { label: "My Applications", href: "/applications",             icon: FileText },
    { label: "Interviews",      href: "/interviews",               icon: Clock },
    { label: "Calendar",        href: "/calendar",                 icon: CalendarDays },
    { label: "My Tasks",        href: "/my-tasks",                 icon: CheckCircle2 },
    { label: "Saved Jobs",      href: "/saved-jobs",               icon: Bookmark },
    { label: "My Assessments",  href: "/learning-hub/assessments",  icon: Target },
    { label: "Skill Test",      href: "/verification/skill-intro", icon: Zap },
    { label: "Skill Gap",       href: "/skill-gap-detection",      icon: BarChart2 },
    { label: "My Profile",      href: "/profile",                  icon: User },
    { label: "Edit Profile",    href: "/profile/edit",             icon: Settings },
  ],
  recruiter: [
    { label: "Overview",         href: "/dashboard",            icon: LayoutDashboard },
    { label: "Post Job",         href: "/post-job",             icon: Plus },
    { label: "Applicants",       href: "/applicants",           icon: Users },
    { label: "Shortlisted",      href: "/shortlisted",          icon: Star },
    { label: "Task Reviews",     href: "/task-submissions",     icon: AlignJustify },
    { label: "Interviews",       href: "/interviews",           icon: Clock },
    { label: "Calendar",         href: "/calendar",             icon: CalendarDays },
    { label: "Final Selected",   href: "/final-selected",       icon: UserCheck },
    { label: "My Jobs",          href: "/my-jobs",              icon: Briefcase },
    { label: "My Profile",       href: "/profile",              icon: User },
  ],
  admin: [
    { label: "Overview",            href: "/dashboard",                         icon: LayoutDashboard },
    { label: "Pending Approvals",   href: "/admin/pending-approvals",           icon: ShieldCheck },
    { label: "Deletion Requests",   href: "/admin/deletion-requests",           icon: AlertTriangle },
    { label: "Approved Jobs",       href: "/admin/approved-jobs",               icon: Briefcase },
    { label: "Users",               href: "/admin/users",                       icon: Users },
    { label: "Learning Content",    href: "/dashboard/admin/learning/paths",    icon: BarChart2 },
  ],
};

const ROLE_COLOR = {
  candidate: { badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  recruiter: { badge: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  admin:     { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-500" },
};

function SidebarInner({
  isMobile = false,
  collapsed,
  setCollapsed,
  onMobileClose,
  navItems,
  pathname,
  user,
  displayName,
  roleLabel,
  colors,
  handleLogout,
}) {
  const isCollapsed = collapsed && !isMobile;

  return (
    <>
      {/* Logo + toggle */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 shrink-0 animate-slide-down">
        {!isCollapsed && (
          <Link href="/" className="text-[16px] font-black text-slate-900 tracking-tight hover-scale">
            Job<span className="text-indigo-600">Match</span>
          </Link>
        )}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors ml-auto hover-scale btn-press"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors hover-scale btn-press ${isCollapsed ? "mx-auto" : "ml-auto"}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* User card */}
      <div className={`px-3 py-4 border-b border-slate-100 shrink-0 animate-slide-down stagger-2 ${isCollapsed ? "flex justify-center" : ""}`}>
        {isCollapsed ? (
          <Avatar src={user?.photoURL} alt={displayName} size="w-9 h-9" />
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar src={user?.photoURL} alt={displayName} size="w-10 h-10" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${colors.dot} rounded-full border-2 border-white`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${colors.badge}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" aria-label="Sidebar navigation">
        {navItems.map(({ label, href, icon: Icon }, index) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => isMobile && onMobileClose?.()}
              title={isCollapsed ? label : undefined}
              className={`sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold animate-stagger-item stagger-${Math.min(index + 1, 8)} ${
                isActive ? "bg-indigo-50 text-indigo-600 active-nav" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
                aria-hidden="true"
              />
              {!isCollapsed && <span className="truncate">{label}</span>}
              {!isCollapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 animate-pop-in" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions — home + logout */}
      <div className="border-t border-slate-100 px-2 py-3 shrink-0 animate-slide-up-fade" style={{ animationDelay: "350ms" }}>
        <Link
          href="/"
          title={isCollapsed ? "Back to Home" : undefined}
          className={`sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors mb-0.5 btn-press ${isCollapsed ? "justify-center" : ""}`}
        >
          <Home className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Back to Home</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Log out" : undefined}
          className={`sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors btn-press ${isCollapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </>
  );
}

export default function DashboardSidebar({
  role = "candidate",
  unreadCount = 0,
  onNotifClick,
  mobileOpen = false,
  onMobileClose,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.candidate;
  const colors = ROLE_COLOR[role] || ROLE_COLOR.candidate;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const sharedProps = {
    collapsed,
    setCollapsed,
    onMobileClose,
    navItems,
    pathname,
    user,
    displayName,
    roleLabel,
    colors,
    handleLogout,
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white flex flex-col shadow-2xl transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarInner isMobile={true} {...sharedProps} />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0 animate-drawer-in-left ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
        aria-label="Dashboard sidebar"
      >
        <SidebarInner {...sharedProps} />
      </aside>
    </>
  );
}
