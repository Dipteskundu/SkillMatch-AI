"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Search,
  Bell,
  ChevronDown,
  User,
  Users,
  Bookmark,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  Lightbulb,
  Home,
  Briefcase,
  Building2,
  Info,
  ChevronRight,
  Zap,
  Clock,
  Sun,
  Moon,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import Avatar from "../common/Avatar";
import NotificationPanel from "../Notifications/NotificationPanel";
import api from "../../lib/apiClient";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, role, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    window.dispatchEvent(new CustomEvent("skillmatch:mobile-menu", { detail: { open: mobileOpen } }));
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) return;
    let intervalId = null;
    let cancelled = false;
    let hadSuccess = false;
    let failures = 0;

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get(`/api/notifications/${user.uid}`);
        const json = res.data;
        if (json.success && json.data)
          setUnreadCount(json.data.unreadCount || 0);
        hadSuccess = true;
        failures = 0;
      } catch (err) {
        failures += 1;
        // Avoid noisy terminal logs when the backend isn't running locally.
        if (failures === 1 && process.env.NODE_ENV !== "production") {
          console.warn("Backend unreachable for notifications (dev):", err?.message || err);
        }
      }
    };

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(fetchUnreadCount, 30000);
    };

    const run = async () => {
      await fetchUnreadCount().catch(() => {});
      if (cancelled) return;
      if (hadSuccess) {
        startPolling();
        return;
      }
      if (failures <= 3) {
        setTimeout(run, 60000);
      }
    };

    run();
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, user?.uid]);

  let profileRoleLabel = "Candidate";
  if (role === "admin") {
      profileRoleLabel = "Admin";
  } else if (role === "recruiter" || role === "employer") {
      profileRoleLabel = "Recruiter";
  }

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Find Jobs", href: "/jobs", icon: Briefcase },
    { name: "Companies", href: "/companies", icon: Building2 },
    { name: "Learning", href: "/learning-hub", icon: GraduationCap },
    { name: "About Us", href: "/about", icon: Info },
  ];

  const userMenuItems =
    profileRoleLabel === "Recruiter"
      ? [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            href: "/dashboard",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            icon: User,
            label: "My Profile",
            href: "/profile",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            icon: Users,
            label: "Applicants",
            href: "/applicants",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: Briefcase,
            label: "My Jobs",
            href: "/my-jobs",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            icon: Clock,
            label: "Interviews",
            href: "/interviews",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ]
      : [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            href: "/dashboard",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            icon: User,
            label: "My Profile",
            href: "/profile",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            icon: Settings,
            label: "Edit Profile",
            href: "/profile/edit",
            color: "text-slate-600",
            bg: "bg-slate-100",
          },
          {
            icon: Bookmark,
            label: "Saved Jobs",
            href: "/saved-jobs",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: FileText,
            label: "My Applications",
            href: "/applications",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            icon: Lightbulb,
            label: "Skill Gap Detection",
            href: "/skill-gap-detection",
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ];

  const userDisplayName =
    userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";

  const closeMobile = (href) => {
    setMobileOpen(false);
    if (href) router.push(href);
  };

  // Search handling
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = (q) => {
    const term = (q || searchQuery || "").trim();
    if (!term) return;
    // Navigate to jobs page with search param
    router.push(`/jobs?search=${encodeURIComponent(term)}`);
    setSearchQuery("");
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const onKeyDownSearch = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSearch();
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-b border-slate-100"
            : "bg-white border-b border-slate-100"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <span className="text-[17px] font-black text-slate-900 tracking-tight">
                JobMatch<span className="text-indigo-600">AI</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`nav-link-underline px-3 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                      isActive
                        ? "text-indigo-600 active"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Logged Out */}
              {!isAuthenticated && (
                <>
                  <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 hover:border-slate-300 focus-within:border-indigo-400 focus-within:bg-white transition-all w-52">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search jobs or skills..."
                      className="bg-transparent text-[13px] text-slate-700 placeholder-slate-400 outline-none w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={onKeyDownSearch}
                    />
                  </div>
                  <Link
                    href="/signin"
                    className="hidden md:inline-flex text-[14px] font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-2"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="hidden md:inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm active:scale-95"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {/* Logged In */}
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => setSearchOpen((v) => !v)}
                    className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    aria-label="Search"
                  >
                    <Search className="w-[18px] h-[18px]" />
                  </button>

                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="hidden md:flex relative items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-[18px] h-[18px]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="sr-only">{unreadCount}</span>
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    aria-label="Toggle theme"
                  >
                    {mounted ? (
                      theme === "dark" ? (
                        <Sun className="w-[18px] h-[18px]" />
                      ) : (
                        <Moon className="w-[18px] h-[18px]" />
                      )
                    ) : (
                      <Sun className="w-[18px] h-[18px]" />
                    )}
                  </button>

                  {/* Desktop Profile Dropdown */}
                  <div className="relative hidden md:block" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileOpen((v) => !v)}
                      className="flex items-center gap-2.5 pl-2 pr-1 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-slate-900 leading-tight line-clamp-1 max-w-[110px]">
                          {userDisplayName}
                        </p>
                        <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide leading-tight">
                          {(profileRoleLabel || "Candidate").toUpperCase()}
                        </p>
                      </div>
                      <Avatar
                        src={user?.photoURL}
                        alt={userDisplayName}
                        size="w-9 h-9"
                        ring={profileOpen}
                      />
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-scale-in">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user?.photoURL}
                              alt={userDisplayName}
                              size="w-10 h-10"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {userDisplayName}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            router.push("/dashboard");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          Dashboard
                        </button>
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              setProfileOpen(false);
                              await logout();
                              router.push("/");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Mobile Hamburger */}
              <button
                type="button"
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 transition-colors hover-scale btn-press"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5 text-slate-700" />
                ) : (
                  <span className="flex flex-col gap-[5px] items-start w-5">
                    <span className="block h-[2.5px] w-5 bg-slate-800 rounded-full" />
                    <span className="block h-[2.5px] w-3 bg-slate-800 rounded-full" />
                    <span className="block h-[2.5px] w-5 bg-slate-800 rounded-full" />
                  </span>
                )}
              </button>

            </div>
          </div>
        </div>

        {/* Desktop Search Popup */}
        {isAuthenticated && searchOpen && (
          <div className="hidden md:block border-t border-slate-100 bg-white px-6 py-3 animate-fade-in">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-indigo-400 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search jobs, companies, or skills..."
                  className="bg-transparent text-[14px] text-slate-700 placeholder-slate-400 outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={onKeyDownSearch}
                />
                <button
                  onClick={() => {
                    // close or submit depending on whether a query exists
                    if (searchQuery.trim()) submitSearch(searchQuery);
                    else setSearchOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="h-16" />

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-overlay-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer Panel ── */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 animate-slide-down">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="text-[17px] font-black text-slate-900 tracking-tight hover-scale"
          >
            <span className="text-indigo-600"></span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors hover-scale btn-press"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* User Profile Card (logged in) */}
          {isAuthenticated && (
            <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-white animate-card-rise stagger-1">
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  src={user?.photoURL}
                  alt={userDisplayName}
                  size="w-12 h-12"
                  ring={true}
                />
                <div className="min-w-0">
                  <p className="font-black text-[15px] leading-tight truncate">
                    {userDisplayName}
                  </p>
                  <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                    {profileRoleLabel || "Candidate"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => closeMobile("/dashboard")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button
                  onClick={() => closeMobile("/profile")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors"
                >
                  <User className="w-3.5 h-3.5" /> Profile
                </button>
                <button
                  onClick={() => {
                    setNotifOpen(true);
                    setMobileOpen(false);
                  }}
                  className="relative flex items-center justify-center w-9 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="px-4 mt-4">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-400 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search jobs or skills..."
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
              />
            </div>
          </div>

          <div className="px-4 mt-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
              aria-label="Toggle theme"
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )
              ) : (
                <Sun className="w-4 h-4" />
              )}
              <span>{mounted && theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-4 mt-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Navigation
            </p>
            <nav className="flex flex-col gap-1">
              {navLinks.map(({ name, href, icon: Icon }, index) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={name}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-semibold transition-all hover-lift animate-stagger-item stagger-${Math.min(index + 1, 8)} ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-transform duration-200 ${isActive ? "bg-indigo-100" : "bg-slate-100"}`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-500"}`}
                      />
                    </span>
                    {name}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pop-in" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logged Out CTAs */}
          {!isAuthenticated && (
            <div className="px-4 mt-5 flex flex-col gap-3">
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 text-center text-[15px] font-black text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95"
              >
                Get Started Free
              </Link>
              <Link
                href="/signin"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 text-center text-[15px] font-semibold text-slate-700 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Log In
              </Link>
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-8" />
        </div>

        {/* Drawer Footer (logged in) */}
        {isAuthenticated && (
          <div className="px-4 py-4 border-t border-slate-100 animate-slide-up-fade">
            <button
              type="button"
              onClick={async () => {
                setMobileOpen(false);
                await logout();
                router.push("/");
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 text-[14px] font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors btn-press hover-scale"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* Global Notification Panel */}
      <NotificationPanel
        uid={user?.uid}
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        setParentUnreadCount={setUnreadCount}
      />
    </>
  );
}
