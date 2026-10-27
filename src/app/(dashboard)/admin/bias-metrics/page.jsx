"use client";

// /admin/bias-metrics — Phase 5 fairness metrics. EVERY number is computed
// from real documents by GET /api/compliance/admin/bias-metrics; the page
// renders exactly what the API returns, including its honest note that no
// demographic statistics exist (the platform collects no protected attributes).

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useGetBiasMetricsQuery } from "../../../store/api/apiSlice";
import {
  Scale,
  Loader2,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  Info,
} from "lucide-react";

const BAND_COLORS = {
  "0-40": "bg-slate-400",
  "40-60": "bg-amber-400",
  "60-80": "bg-indigo-500",
  "80-100": "bg-emerald-500",
};

export default function BiasMetricsPage() {
  const { role, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/signin?redirect=/admin/bias-metrics");
      return;
    }
    if (role !== "admin") router.push("/dashboard");
  }, [authLoading, isAuthenticated, role, router]);

  const query = useGetBiasMetricsQuery(undefined, {
    skip: !isAuthenticated || authLoading,
  });

  const d = query.data?.data;
  const maxBand = Math.max(1, ...(d?.scoreBands || []).map((b) => b.count));

  if (authLoading || !isAuthenticated || role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
        Checking access…
      </div>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="w-6 h-6 text-indigo-600" aria-hidden="true" />
            Fairness &amp; Bias Metrics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregate score distribution and skill-provenance coverage —
            computed from live documents only.
          </p>
        </div>
        <Link
          href="/compliance"
          className="text-sm font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          Public disclosure
        </Link>
      </header>

      {query.isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Computing metrics…
        </div>
      )}

      {query.isError && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Metrics unavailable</p>
            <p className="text-amber-700 mt-0.5">
              Could not load bias metrics. No numbers are shown unless they can
              be computed.
            </p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-2 text-xs font-bold text-amber-900 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {d && (
        <>
          {/* Score bands */}
          <section aria-labelledby="bands-heading" className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 id="bands-heading" className="font-bold text-sm flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              Fit Score distribution
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              {d.sampleSize.scoredApplications} scored of {d.sampleSize.applications} applications
              sampled.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {d.scoreBands.map((b) => (
                <div key={b.band} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-2xl font-bold text-foreground">{b.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Score {b.band} · {b.pct}%
                  </p>
                  <div className="h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAND_COLORS[b.band] || "bg-indigo-500"}`}
                      style={{ width: `${(b.count / maxBand) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Coverage */}
          <div className="grid md:grid-cols-2 gap-6">
            <section aria-labelledby="coverage-heading" className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 id="coverage-heading" className="font-bold text-sm flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                Skill evidence provenance
              </h2>
              <ul role="list" className="space-y-3">
                {Object.entries(d.coverageBySkillSource).map(([source, count]) => (
                  <li key={source} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{source}-verified</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Assessment coverage:{" "}
                <strong>{d.assessmentCoveragePct}%</strong> of scored
                applications include an assessment component. Jobs with scores:{" "}
                <strong>
                  {d.jobs.withScores}/{d.jobs.total}
                </strong>
                .
              </p>
            </section>

            <section aria-labelledby="method-heading" className="bg-indigo-50 rounded-2xl border border-indigo-200 p-6">
              <h2 id="method-heading" className="font-bold text-sm flex items-center gap-2 mb-3 text-indigo-900">
                <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                Method &amp; limitations
              </h2>
              <p className="text-xs text-indigo-900 leading-relaxed">{d.note}</p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
