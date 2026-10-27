"use client";

// /pricing — Phase 5: real prices from GET /api/billing/plans (single source
// of truth on the server), honest checkout wiring (Stripe when configured,
// contact-us onboarding before that), no fabricated social proof.

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  LayoutGrid,
  ArrowDown,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import PageWrapper from "../components/common/PageWrapper";
import { useAuth } from "../lib/AuthContext";
import {
  useGetPlansQuery,
  useCreateCheckoutMutation,
} from "../store/api/apiSlice";

const FALLBACK_PLANS = {
  free: {
    name: "Free",
    price: "$0",
    per: "/month",
    features: [
      { name: "Profile + resume skill extraction", checked: true },
      { name: "Job matches with the Hiring Fit Score", checked: true },
      { name: "Skill gap analysis", checked: true },
      { name: "1 learning path, 3 lessons/day", checked: true },
      { name: "Micro-assessments", checked: true },
      { name: "Email support", checked: true },
    ],
    cta: "Get Started Free",
    ctaLink: "/signup",
  },
  pro: {
    name: "Pro",
    price: "$19",
    per: "/month",
    features: [
      { name: "Everything in Free", checked: true },
      { name: "Unlimited learning paths + certificates", checked: true },
      { name: "Unlimited lessons (no daily cap)", checked: true },
      { name: "Monthly AI credit grant", checked: true },
    ],
  },
  starter: {
    name: "Starter",
    price: "$99",
    per: "/month",
    features: [
      { name: "2 recruiter seats", checked: true },
      { name: "3 job postings", checked: true },
      { name: "Basic matching", checked: true },
      { name: "Email support", checked: true },
    ],
    cta: "Talk to Sales",
    ctaLink: "/contact",
  },
  growth: {
    name: "Growth",
    price: "$399",
    per: "/month",
    features: [
      { name: "5 recruiter seats", checked: true },
      { name: "Unlimited jobs", checked: true },
      { name: "Fit score + copilot", checked: true },
      { name: "API access", checked: true },
      { name: "Priority support", checked: true },
    ],
    cta: "Talk to Sales",
    ctaLink: "/contact",
  },
  scale: {
    name: "Scale",
    price: "$1,999",
    per: "/month",
    features: [
      { name: "Unlimited seats", checked: true },
      { name: "SSO + SAML", checked: true },
      { name: "ATS integrations", checked: true },
      { name: "Compliance Center", checked: true },
      { name: "Bias dashboards", checked: true },
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
  },
};

function formatPrice(amountCents) {
  if (typeof amountCents !== "number") return null;
  return `$${(amountCents / 100).toLocaleString("en-US")}`;
}

export default function PricingPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: plansRes } = useGetPlansQuery();
  const [checkout, checkoutState] = useCreateCheckoutMutation();
  const [checkoutError, setCheckoutError] = useState(null);

  const configured = plansRes?.data?.configured ?? false;
  const serverPlans = plansRes?.data?.plans || [];
  const serverPro = serverPlans.find((p) => p.id === "pro");

  // Merge server truth (price/features) over the static fallback.
  const proPriceLabel =
    formatPrice(serverPro?.price?.amount) || FALLBACK_PLANS.pro.price;
  const proFeatures =
    serverPro?.features?.map((name) => ({ name, checked: true })) ||
    FALLBACK_PLANS.pro.features;
  const proPriceId = serverPro?.priceId || null;

  async function startProCheckout() {
    setCheckoutError(null);
    if (authLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/signin?redirect=/pricing";
      return;
    }
    try {
      const res = await checkout().unwrap();
      if (res?.data?.url) {
        window.location.href = res.data.url;
      } else {
        setCheckoutError("Checkout did not return a URL. Please try again.");
      }
    } catch (err) {
      const code = err?.data?.error?.code;
      setCheckoutError(
        code === "BILLING_NOT_CONFIGURED"
          ? "Checkout isn't live yet — use Talk to Sales and we'll set you up."
          : "Could not start checkout right now. Please try again.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfdfe]">
      <Navbar />

      <main className="pt-8 sm:pt-12 pb-24">
        <PageWrapper>
          {/* Hero Section */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
            <div className="max-w-3xl animate-fade-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
                Pricing that works for every stage of your journey
              </h1>
              <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl">
                Start free with real skill matching and learning. Upgrade to Pro
                for unlimited learning — or talk to us about recruiter tiers.
              </p>
            </div>
          </section>

          {/* Honest billing status banner */}
          {!configured && (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
              <p className="flex items-start gap-2 text-sm text-slate-600 bg-slate-100 border border-slate-200 rounded-2xl p-4">
                <AlertCircle
                  className="w-4 h-4 mt-0.5 shrink-0 text-slate-500"
                  aria-hidden="true"
                />
                <span>
                  Online checkout launches soon. Until then, Pro and recruiter
                  tiers are set up through{" "}
                  <Link href="/contact" className="font-semibold text-indigo-600 underline underline-offset-2">
                    Talk to Sales
                  </Link>
                  . Entitlements activate automatically once payments are live.
                </span>
              </p>
            </section>
          )}

          {/* Free Plan */}
          <section className="mb-12">
            <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-indigo-500" />
                <span className="text-xl font-black text-slate-900">Free</span>
                <span className="text-base text-slate-400 ml-auto">
                  $0 <span className="text-sm font-medium">/month</span>
                </span>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                {FALLBACK_PLANS.free.features.map((feat) => (
                  <li key={feat.name} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                    <span className="flex-1">{feat.name}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Get Started Free
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* Other Plans Grid */}
          <section className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Pro — checkout-aware card */}
              <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 border-2 border-indigo-500 relative">
                <span className="absolute -top-3 left-6 text-[11px] font-black uppercase tracking-wide bg-indigo-600 text-white px-2.5 py-1 rounded-full">
                  Most popular
                </span>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-500" aria-hidden="true" />
                  <span className="text-xl font-black text-slate-900">Pro</span>
                  <span className="text-base text-slate-400 ml-auto">
                    {proPriceLabel} <span className="text-sm font-medium">/month</span>
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {proFeatures.map((feat) => (
                    <li key={feat.name} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                      <span className="flex-1">{feat.name}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {configured && proPriceId ? (
                    <button
                      type="button"
                      onClick={startProCheckout}
                      disabled={checkoutState.isLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {checkoutState.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                      )}
                      Upgrade to Pro
                    </button>
                  ) : (
                    <Link
                      href="/contact"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      Get Pro — talk to us
                    </Link>
                  )}
                  {checkoutError && (
                    <p role="alert" className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      {checkoutError}
                    </p>
                  )}
                </div>
              </div>

              {["starter", "growth", "scale"].map((key) => {
                const tier = FALLBACK_PLANS[key];
                return (
                  <div
                    key={key}
                    className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 border border-slate-100 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <LayoutGrid className="w-6 h-6 text-indigo-500" aria-hidden="true" />
                      <span className="text-xl font-black text-slate-900">{tier.name}</span>
                      <span className="text-base text-slate-400 ml-auto">
                        {tier.price} {tier.per}
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {tier.features.map((feat) => (
                        <li key={feat.name} className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                          <span className="flex-1">{feat.name}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <Link
                        href={tier.ctaLink}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        {tier.cta}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              Recruiter tiers are onboarded with our team — features roll out
              during onboarding, so talk to sales for current availability.
            </p>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-8 sm:p-12 text-center text-white">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to level up your hiring?</h2>
              <p className="text-slate-200 text-sm mb-8">
                Create a free profile and see your Hiring Fit Score on real
                jobs — no credit card required.
              </p>
              <div className="space-y-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Get Your Free Profile
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white hover:bg-white/20 transition-colors"
                >
                  Talk to Sales
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </Link>
                <div>
                  <Link
                    href="/compliance"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-200 underline underline-offset-4 hover:text-white"
                  >
                    How our AI scores work — Transparency Center
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
