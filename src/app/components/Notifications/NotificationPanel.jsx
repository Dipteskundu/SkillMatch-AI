"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  CheckCircle,
  CheckCheck,
  Briefcase,
  Eye,
  Star,
  Award,
  XCircle,
  Calendar,
} from "lucide-react";
import api from "../../lib/apiClient";
import { safeError } from "../../lib/logger";

const TYPE_CONFIG = {
  application_viewed: { icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
  application_status: {
    icon: CheckCircle,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  interview_scheduled: {
    icon: Calendar,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  status_shortlisted: {
    icon: Star,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  status_interview: {
    icon: Briefcase,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  status_offer: { icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
  status_rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-50" },
  status_hired: { icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
  default: { icon: Bell, color: "text-slate-400", bg: "bg-slate-50" },
};

function NotificationItem({ notif, onRead }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:bg-slate-50 group
        ${!notif.read ? "bg-indigo-50/40" : ""}`}
      onClick={() => onRead(notif)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onRead(notif)}
    >
      <div
        className={`${cfg.bg} ${cfg.color} p-2.5 rounded-xl shrink-0 mt-0.5`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${!notif.read ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}
        >
          {notif.message}
        </p>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          {notif.createdAt
            ? new Date(notif.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "\u2014"}
        </p>
      </div>
      {!notif.read && (
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 group-hover:bg-indigo-600" />
      )}
    </div>
  );
}

export default function NotificationPanel({
  uid,
  isOpen,
  onClose,
  setParentUnreadCount,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Derive unreadCount directly during render, no effect needed
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!uid) return;
    let mounted = true;

    api.get(`/api/notifications/${uid}`)
      .then((res) => {
        if (!mounted) return;
        const json = res.data;
        if (json.success && json.data) {
          const fetchedNotifs = json.data.notifications || [];
          setNotifications(fetchedNotifs);
          if (setParentUnreadCount) {
            setParentUnreadCount(fetchedNotifs.filter((n) => !n.read).length);
          }
        }
      })
      .catch((err) => {
        // Avoid repeated noisy logs when the backend is offline in dev.
        safeError("Failed to fetch notifications", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [uid, setParentUnreadCount]);

  async function handleNotificationClick(notif) {
    const id = notif._id || notif.id;

    // Route to jobs page with the applyJobId query param so it auto-opens
    if (notif.jobId) {
      router.push(`/jobs?applyJobId=${notif.jobId}`);
      onClose(); // Close panel on navigation
    }

    // Only mark as read if it's currently unread
    if (!notif.read) {
      try {
        const res = await api.patch(`/api/notifications/${id}/read`);
        const json = res.data;
        if (json.success) {
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === id || n.id === id ? { ...n, read: true } : n,
            ),
          );
          if (setParentUnreadCount) {
            setParentUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      } catch (err) {
        safeError("Failed to mark notification as read", err);
      }
    }
  }

  async function markAllRead() {
    try {
      const res = await api.patch(`/api/notifications/read-all/${uid}`);
      const json = res.data;
      if (json.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        if (setParentUnreadCount) {
          setParentUnreadCount(0);
        }
      }
    } catch (err) {
      safeError("Failed to mark all as read", err);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed top-24 right-4 sm:right-8 z-50 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs text-indigo-600 font-bold">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                All read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[400px] overflow-y-auto p-3">
          {loading && (
            <div className="space-y-3 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded-lg w-4/5" />
                    <div className="h-2.5 bg-slate-50 rounded-lg w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="py-12 text-center">
              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">All caught up!</p>
              <p className="text-xs text-slate-300 mt-1">
                No notifications yet.
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="space-y-1">
              {notifications.map((n, idx) => (
                <NotificationItem
                  key={n._id || idx}
                  notif={n}
                  onRead={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-50 p-4">
            <p className="text-center text-xs text-slate-300 font-medium">
              Showing last {notifications.length} notifications
            </p>
          </div>
        )}
      </div>
    </>
  );
}
