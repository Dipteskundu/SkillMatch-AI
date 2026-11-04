"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../lib/AuthContext";
import { API_BASE, apiFetch } from "../../../lib/apiClient";
import {
  Users, Search, Shield, Briefcase, User, BadgeCheck,
  MapPin, Calendar, ChevronLeft, ChevronRight, Loader2, RefreshCw,
} from "lucide-react";
import Avatar from "../../../components/common/Avatar";

const ROLE_META = {
  candidate: { label: "Candidate", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  recruiter:  { label: "Recruiter", color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
  admin:      { label: "Admin",     color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" },
};

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const res = await apiFetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleRole = (e) => { setRoleFilter(e.target.value); setPage(1); };

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">All Users</h1>
              <p className="text-slate-500 text-sm mt-0.5">{total} total users on the platform</p>
            </div>
          </div>
          <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
          </div>
          <select value={roleFilter} onChange={handleRole}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Roles</option>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const rm = ROLE_META[u.role] || ROLE_META.candidate;
              const RoleIcon = u.role === "admin" ? Shield : u.role === "recruiter" ? Briefcase : User;
              return (
                <div key={u._id || u.firebaseUid}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-indigo-100 transition-all">
                  {/* Avatar */}
                  <Avatar src={u.photoURL} alt={u.displayName || u.email} size="w-11 h-11"
                    className="rounded-full border-2 border-slate-100 shrink-0" />

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900 truncate">
                        {u.displayName || u.email?.split("@")[0] || "User"}
                      </p>
                      {u.isSkillVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black rounded-full">
                          <BadgeCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{u.email}</p>
                    {(u.title || u.location) && (
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        {u.title && <span>{u.title}</span>}
                        {u.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{u.location}</span>}
                      </div>
                    )}
                  </div>

                  {/* Role badge */}
                  <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${rm.bg} ${rm.color} ${rm.border} shrink-0`}>
                    <RoleIcon className="w-3 h-3" /> {rm.label}
                  </span>

                  {/* Joined date */}
                  {u.createdAt && (
                    <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
            <p className="text-sm text-slate-500 font-medium">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} users
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      page === p ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
