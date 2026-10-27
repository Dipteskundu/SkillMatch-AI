"use client";

// /compliance — Trust Center: AI/score disclosure (public) and self-serve
// data export + own audit log (signed-in). All facts come from the backend
// disclosure endpoint — this page never invents claims or numbers.

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import PageWrapper from "../components/common/PageWrapper";
import { useAuth } from "../lib/AuthContext";
import {
  useGetDisclosureQuery,
  useLazyGetScoreExportQuery,
  useGetAuditLogQuery,
} from "../store/api/apiSlice";
import {
  ShieldCheck,
  Download,
  FileText,
  History,
  Loader2,
  AlertCircle,
  Bot,
  Users,
  Scale,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function Section({ icon: Icon, title, children, id }) {
  return (
    <section aria-labelledby={id} className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 id={id} className="font-bold text-foreground flex items-center gap-2 mb-4 text-base">
        <Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function CompliancePage() {
  const { isAuthenticated, loading } = useAuth();
  const disclosure = useGetDisclosureQuery();
  const [page, setPage] = useState(1);
  const audit = useGetAuditLogQuery(page, { skip: !isAuthenticated || loading });
  const [triggerExport, exportState] = useLazyGetScoreExportQuery();
  const [exportError, setExportError] = useState(null);

  const d = disclosure.data?.data;

  async function downloadExport() {
    setExportError(null);
    try {
      const res = await triggerExport().unwrap();
      const payload = res?.data || res;
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skillmatch-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Could not build your export right now. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PageWrapper>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
              Trust Center
            </p>
            <h1 className="text-3xl font-extrabold text-foreground">
              Transparency &amp; Your Data
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              How our scoring works, what it uses, and how to get a copy of
              everything we hold about you.
            </p>
          </header>

          <div className="space-y-6">
            {/* ── AI disclosure ── */}
            <Section icon={Bot} title="AI & Fit Score disclosure" id="ai-disclosure">
              {disclosure.isLoading && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Loading disclosure…
                </p>
              )}
              {disclosure.isError && (
                <p role="alert" className="text-sm text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  The disclosure could not be loaded right now.{" "}
                  <button
                    type="button"
                    onClick={() => disclosure.refetch()}
                    className="underline font-semibold"
                  >
                    Retry
                  </button>
                </p>
              )}
              {d && (
                <div className="space-y-5 text-sm">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(d.weights).map(([k, v]) => (
                      <div key={k} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-indigo-600">{v}%</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                          {k.replace(/([A-Z])/g, " $1")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{d.howItWorks}</p>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1.5">Data used</h3>
                    <ul className="space-y-1 text-muted-foreground">
                      {d.dataUsed.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5" aria-hidden="true">›</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Model version:</strong>{" "}
                    {d.scoreModelVersion}
                  </p>
                </div>
              )}
            </Section>

            {/* ── Fairness & human oversight ── */}
            <div className="grid md:grid-cols-2 gap-6">
              <Section icon={Scale} title="Fairness" id="fairness">
                <p className="text-sm text-muted-foreground leading-relaxed">{d?.demographics}</p>
                {!d && !disclosure.isLoading && !disclosure.isError && (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}
              </Section>
              <Section icon={Users} title="Human oversight" id="oversight">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {d?.humanInTheLoop ||
                    "Recruiters make all hiring decisions — scores are decision support, never automation."}
                </p>
              </Section>
            </div>

            {/* ── Signed-in: data export + audit log ── */}
            {isAuthenticated && !loading && (
              <>
                <Section icon={Download} title="Export your data" id="export">
                  <p className="text-sm text-muted-foreground mb-4">
                    Download a JSON copy of your profile, applications with
                    their score breakdowns and evidence, certificates, and
                    learning progress.
                  </p>
                  {exportError && (
                    <p role="alert" className="text-xs text-amber-700 mb-3 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      {exportError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={downloadExport}
                    disabled={exportState.isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {exportState.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="w-4 h-4" aria-hidden="true" />
                    )}
                    Download JSON export
                  </button>
                </Section>

                <Section icon={History} title="Your activity log" id="audit-log">
                  {audit.isLoading && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Loading activity…
                    </p>
                  )}
                  {audit.isError && (
                    <p className="text-sm text-amber-700">Activity log unavailable right now.</p>
                  )}
                  {audit.data?.data && (
                    <>
                      {audit.data.data.entries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No sensitive actions recorded yet (exports, key
                          changes, and plan events appear here).
                        </p>
                      ) : (
                        <ul role="list" className="divide-y divide-slate-100">
                          {audit.data.data.entries.map((e, i) => (
                            <li key={`${e.action}-${i}`} className="py-2.5 flex items-center justify-between gap-3">
                              <span className="text-sm text-foreground font-medium capitalize">
                                {e.action.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {e.at ? new Date(e.at).toLocaleString() : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {audit.data.data.total > 10 && (
                        <nav className="flex items-center justify-between mt-4" aria-label="Activity log pages">
                          <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 disabled:opacity-40 hover:underline"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" /> Newer
                          </button>
                          <span className="text-xs text-muted-foreground">
                            Page {page} of {Math.max(1, Math.ceil(audit.data.data.total / 10))}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page * 10 >= audit.data.data.total}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 disabled:opacity-40 hover:underline"
                          >
                            Older <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </nav>
                      )}
                    </>
                  )}
                </Section>
              </>
            )}

            {!isAuthenticated && !loading && (
              <section className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-indigo-900">
                  Sign in to export your data and review your personal activity
                  log.
                </p>
                <Link
                  href="/signin"
                  className="text-sm font-semibold text-indigo-700 underline underline-offset-2 shrink-0"
                >
                  Sign in
                </Link>
              </section>
            )}

            {/* ── Legal links ── */}
            <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground pt-2">
              <Link href="/privacy" className="hover:text-indigo-600 inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4" aria-hidden="true" /> Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
              <Link href="/contact" className="hover:text-indigo-600 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Questions? Contact us
              </Link>
              <a
                href="/api/compliance/disclosure"
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-600 inline-flex items-center gap-1.5"
              >
                Machine-readable disclosure <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </footer>
          </div>
        </main>
      </PageWrapper>
      <Footer />
    </div>
  );
}
