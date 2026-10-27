"use client";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { useAuth } from "../lib/AuthContext";
import {
  Search,
  MapPin,
  Users,
  Star,
  ChevronRight,
  ChevronLeft,
  Building,
  Globe,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageWrapper from "../components/common/PageWrapper";
import api, { API_BASE } from "../lib/apiClient";

const COMPANIES_PER_PAGE = 9;

/** Pagination component */
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <nav
      className="flex items-center justify-center gap-1.5 mt-14"
      aria-label="Pagination"
    >
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p) => {
        const isEllipsis =
          total > 7 &&
          p !== 1 &&
          p !== total &&
          (p < current - 2 || p > current + 2);
        if (isEllipsis) {
          if (p === current - 3 || p === current + 3)
            return (
              <span key={p} className="px-1 text-slate-400">
                …
              </span>
            );
          return null;
        }
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${
              p === current
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            aria-current={p === current ? "page" : undefined}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "E-commerce",
  "Manufacturing",
  "Media",
  "Consulting",
];

export default function CompaniesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const apiBase = API_BASE;

  /* ── Data ── */
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");

  /* ── Filters ── */
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [sortBy, setSortBy] = useState("default");

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Fetch ── */
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await api.get("/api/v1/companies");
        setCompanies(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch companies", err);
        setError("Could not load companies. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, [apiBase]);

  /* ── Derived: filtered + sorted list ── */
  const filtered = (() => {
    let list = [...companies];

    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(t)) ||
          (c.industry && c.industry.toLowerCase().includes(t)) ||
          (c.location && c.location.toLowerCase().includes(t)),
      );
    }

    if (selectedIndustry) {
      list = list.filter(
        (c) =>
          c.industry &&
          c.industry.toLowerCase().includes(selectedIndustry.toLowerCase()),
      );
    }

    if (sortBy === "rating") {
      list.sort(
        (a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0),
      );
    } else if (sortBy === "jobs") {
      list.sort(
        (a, b) => (parseInt(b.openJobs) || 0) - (parseInt(a.openJobs) || 0),
      );
    } else if (sortBy === "employees") {
      list.sort(
        (a, b) => (parseInt(b.employees) || 0) - (parseInt(a.employees) || 0),
      );
    }

    return list;
  })();

  /* ── Pagination math ── */
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / COMPANIES_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * COMPANIES_PER_PAGE,
    safePage * COMPANIES_PER_PAGE,
  );

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedIndustry("");
    setSortBy("default");
    setCurrentPage(1);
  };

  const handleFollow = async (company) => {
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    try {
      const res = await api.post(`/api/v1/companies/${company._id}/follow`, { uid: user.uid, email: user.email });
      if (res.status === 200 || res.data.success) {
        setInfoMessage(`Now following ${company.name} ✓`);
        setTimeout(() => setInfoMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to follow company", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfe]">
      <Navbar />

      <main className="pt-8 sm:pt-12 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PageWrapper>
            {/* ── Page Header ── */}
            <div className="max-w-3xl mb-12 animate-fade-up">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Work with the world&apos;s{" "}
                <span className="text-indigo-600">leading</span> companies
              </h1>
              <p className="mt-3 text-slate-500 text-lg leading-relaxed">
                Explore professional environments that foster growth,
                innovation, and excellence. Follow your favourite companies and
                stay updated on their latest openings.
              </p>
            </div>

            {/* ── Search & Filters Row ── */}
            <div className="flex flex-col md:flex-row items-center gap-3 mb-10">
              {/* Search */}
              <div className="flex-1 w-full relative">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 focus-within:border-indigo-400 transition-all premium-shadow">
                  <Search className="w-4.5 w-[18px] h-[18px] text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by company name, industry or location…"
                    className="w-full bg-transparent text-sm text-slate-800 font-medium placeholder:text-slate-400 outline-none"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Industry Filter */}
              <select
                value={selectedIndustry}
                onChange={(e) => {
                  setSelectedIndustry(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-2xl px-5 py-3.5 focus:ring-indigo-500 focus:border-indigo-400 cursor-pointer premium-shadow outline-none min-w-[170px]"
              >
                <option value="">All Industries</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-2xl px-5 py-3.5 focus:ring-indigo-500 focus:border-indigo-400 cursor-pointer premium-shadow outline-none min-w-[160px]"
              >
                <option value="default">Sort: Default</option>
                <option value="rating">Top Rated</option>
                <option value="jobs">Most Open Roles</option>
                <option value="employees">Largest Teams</option>
              </select>
            </div>

            {/* ── Results summary ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <p className="text-sm text-slate-500 font-medium">
                Showing{" "}
                <span className="font-black text-slate-900">
                  {filtered.length}
                </span>{" "}
                compan{filtered.length !== 1 ? "ies" : "y"}
                {(searchTerm || selectedIndustry) && (
                  <span className="text-indigo-600"> (filtered)</span>
                )}
              </p>
              {(searchTerm || selectedIndustry || sortBy !== "default") && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-500 font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* ── Success toast ── */}
            {infoMessage && (
              <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-700 font-medium animate-fade-in">
                {infoMessage}
              </div>
            )}

            {/* ── States ── */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-72 bg-slate-100 rounded-[2.5rem] animate-pulse"
                  />
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-medium text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-2xl font-black text-slate-200 mb-2">
                  No companies found
                </p>
                <p className="text-slate-400 text-sm mb-4">
                  Try a different search term or industry.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* ── Company Grid ── */}
            {!loading && !error && paginated.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginated.map((company) => (
                  <div
                    key={company._id || company.id}
                    className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 premium-shadow hover:border-indigo-200 hover:shadow-indigo-50/50 transition-all group flex flex-col h-full relative overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-7">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-xl group-hover:bg-indigo-50 transition-colors border border-slate-100 shrink-0">
                        {company.logo || <Building className="w-6 h-6" />}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {company.rating && (
                          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-black text-amber-700">
                              {company.rating}
                            </span>
                          </div>
                        )}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Globe className="w-3 h-3" /> Website
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                        {company.name}
                      </h3>
                      <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-3">
                        {company.industry}
                      </p>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                        {company.description}
                      </p>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2.5 text-slate-600 text-sm font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {company.location}
                        </div>
                        {company.employees && (
                          <div className="flex items-center gap-2.5 text-slate-600 text-sm font-medium">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {company.employees.toLocaleString()} Employees
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Open Roles
                        </span>
                        <span className="text-2xl font-black text-slate-900">
                          {company.openJobs ?? "—"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFollow(company)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all active:scale-95"
                      >
                        {isAuthenticated ? "Follow" : "Sign in"}{" "}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Decorative glow */}
                    <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            <Pagination
              current={safePage}
              total={totalPages}
              onChange={handlePageChange}
            />

            {/* Page info */}
            {!loading && filtered.length > 0 && (
              <p className="text-center text-xs text-slate-400 mt-4">
                Page {safePage} of {totalPages} · {filtered.length} total
                companies
              </p>
            )}

            {/* ── CTA Banner ── */}
            <div className="mt-16 sm:mt-20 p-8 sm:p-10 md:p-14 bg-indigo-600 rounded-3xl sm:rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10 relative overflow-hidden reveal">
              <div className="relative z-10 text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-black mb-3">
                  Hiring for your team?
                </h2>
                <p className="text-indigo-100 text-base sm:text-lg max-w-xl leading-relaxed">
                  Post your roles, review skill-verified candidates, and build
                  your team — all in one place.
                </p>
              </div>
              <div className="relative z-10 flex flex-wrap gap-4 w-full md:w-auto">
                <Link
                  href="/signup"
                  className="flex-1 md:flex-none text-center px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-colors premium-shadow whitespace-nowrap"
                >
                  Post a Job
                </Link>
                <Link
                  href="/contact"
                  className="flex-1 md:flex-none text-center px-8 py-4 border-2 border-indigo-400 rounded-2xl font-black hover:bg-indigo-500 transition-colors whitespace-nowrap"
                >
                  Contact us
                </Link>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-[120px]" />
              </div>
            </div>
          </PageWrapper>
        </div>
      </main>

      <Footer />
    </div>
  );
}
