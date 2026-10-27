"use client";

// PlanCard — Phase 5 plan + credits summary for the candidate dashboard.
// Reads GET /api/billing/subscription (env-gated): with no Stripe keys the
// card honestly says payments aren't live yet instead of faking a checkout.

import Link from "next/link";
import { useState } from "react";
import { Sparkles, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useGetSubscriptionQuery,
  useCreateCheckoutMutation,
  useOpenBillingPortalMutation,
} from "../../store/api/apiSlice";
import { useAuth } from "../../lib/AuthContext";

export default function PlanCard() {
  const { isAuthenticated, loading } = useAuth();
  const { data, isError, isFetching } = useGetSubscriptionQuery(undefined, {
    skip: !isAuthenticated || loading,
  });
  const [checkout, checkoutState] = useCreateCheckoutMutation();
  const [portal, portalState] = useOpenBillingPortalMutation();
  const [error, setError] = useState(null);

  if (!isAuthenticated || loading) return null;
  if (isError) return null; // honest degradation — no plan info, no fake card
  if (isFetching && !data) {
    return (
      <section aria-label="Your plan" className="reveal delay-100">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Loading your plan…
        </div>
      </section>
    );
  }
  if (!data?.success) return null;

  const { plan, status, cancelAtPeriodEnd, configured, credits } = data.data || {};
  const isPro = plan === "pro";

  async function startCheckout() {
    setError(null);
    try {
      const res = await checkout().unwrap();
      if (res?.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError("Checkout did not return a URL. Please try again.");
      }
    } catch (err) {
      const code = err?.data?.error?.code;
      setError(
        code === "BILLING_NOT_CONFIGURED"
          ? "Payments aren't live yet — subscribe via the contact page to get Pro early."
          : "Could not start checkout right now. Please try again.",
      );
    }
  }

  async function openPortal() {
    setError(null);
    try {
      const res = await portal().unwrap();
      if (res?.data?.url) window.location.href = res.data.url;
      else setError("Billing portal did not open. Please try again.");
    } catch {
      setError("Could not open the billing portal right now.");
    }
  }

  return (
    <section aria-labelledby="plan-heading" className="reveal delay-100">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isPro ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p id="plan-heading" className="font-bold text-sm text-foreground">
                {isPro ? "Pro plan" : "Free plan"}
                {isPro && status && status !== "active" ? ` · ${status.replace(/_/g, " ")}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {isPro
                  ? cancelAtPeriodEnd
                    ? "Cancels at period end — renews can be managed below."
                    : "Unlimited lessons, all paths, certificates."
                  : "1 learning path · 3 lessons/day · core matching."}
                {typeof credits?.balance === "number"
                  ? ` · ${credits.balance} AI credits left this month`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isPro &&
              (configured ? (
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={checkoutState.isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {checkoutState.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                  )}
                  Upgrade — $19/mo
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  See plans
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              ))}
            {isPro && configured && (
              <button
                type="button"
                onClick={openPortal}
                disabled={portalState.isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-foreground hover:bg-slate-50 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {portalState.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                )}
                Manage billing
              </button>
            )}
            {isPro && !configured && (
              <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                Active
              </span>
            )}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
