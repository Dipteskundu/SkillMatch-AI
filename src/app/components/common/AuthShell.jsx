"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rocket, ArrowLeft, X, Github } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Target,
  Shield,
  Building2,
  Sparkles,
  Briefcase,
  BookOpen,
} from "lucide-react";

/**
 * Shared auth layout, Pixelcot-style: pastel gradient page, one big rounded
 * card — form on the left, animated orbit illustration on the right. Both
 * pages pass heading + panel copy; children render between the heading and
 * the shared "Or login with" row. Social buttons toast "coming soon".
 */

// Domain orbit: icon, which ring (0 inner → 2 outer), angle in degrees.
// Ring 1 rotates slowly; its chips counter-rotate to stay upright.
const ORBIT_CHIPS = [
  { icon: Target, ring: 0, angle: -50 },
  { icon: Shield, ring: 0, angle: 140 },
  { icon: Building2, ring: 1, angle: -20 },
  { icon: Sparkles, ring: 1, angle: 120 },
  { icon: Briefcase, ring: 2, angle: 30 },
  { icon: BookOpen, ring: 2, angle: 210 },
];
const RING_WIDTH = ["60%", "100%", "144%"]; // of the square orbit zone

function onEdge(ring, angle) {
  const rad = (angle * Math.PI) / 180;
  const r = [30, 50, 72][ring];
  return {
    left: `${50 + r * Math.cos(rad)}%`,
    top: `${50 + r * Math.sin(rad)}%`,
  };
}

const SOCIALS = [
  {
    name: "Google",
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46.98 14.96 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84C6.71 6.19 9.14 5.04 12 5.04z" />
        <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
        <path fill="#FBBC05" d="M5.84 14.71c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09L2.18 7.7C1.43 9.24 1 10.96 1 12.62s.44 3.38 1.18 4.92l3.66-2.83z" />
        <path fill="#34A853" d="M12 23.62c3.06 0 5.62-1.01 7.52-2.73l-3.86-3c-1.08.72-2.45 1.16-3.66 1.16-2.86 0-5.29-1.93-6.16-4.53l-3.66 2.84c1.81 3.6 5.52 6.06 9.82 6.06z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    svg: <Github className="w-5 h-5 text-slate-900" aria-hidden="true" />,
  },
];

function OrbitChip({ icon: Icon, ring, angle }) {
  const chip = (
    <span className="animate-float-gentle bg-white border border-indigo-50 shadow-[0_8px_20px_rgba(79,70,229,0.18)] w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-indigo-600">
      <Icon className="w-5 h-5" aria-hidden="true" />
    </span>
  );
  const pos = onEdge(ring, angle);

  // Chips on the rotating ring need one wrapper to counter the ring's spin.
  if (ring === 1) {
    return (
      <div className="absolute" style={{ ...pos, transform: "translate(-50%,-50%)" }} aria-hidden="true">
        <span
          className="block"
          style={{ animation: "spin-slow 70s linear infinite reverse" }}
        >
          {chip}
        </span>
      </div>
    );
  }
  return (
    <div className="absolute" style={{ ...pos, transform: "translate(-50%,-50%)" }} aria-hidden="true">
      {chip}
    </div>
  );
}

export default function AuthShell({
  heading,
  subheading,
  panelTitle,
  panelCaption,
  children,
}) {
  const router = useRouter();
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // Back to wherever the user came from; direct URL entry falls back to home.
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  // Social providers aren't wired to the backend yet — honest feedback only.
  const comingSoon = (name) => {
    setToast(`${name} sign-in is coming soon.`);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="animate-page-enter min-h-screen bg-gradient-to-br from-fuchsia-100 via-indigo-100 to-sky-200 p-3 sm:p-6 lg:p-8 flex flex-col">
      {/* Soft pulsing glows behind the card */}
      <div
        className="animate-glow-pulse fixed -top-20 -left-20 h-80 w-80 rounded-full bg-fuchsia-200/50 blur-[90px]"
        aria-hidden="true"
      />
      <div
        className="animate-glow-pulse fixed -bottom-24 -right-16 h-96 w-96 rounded-full bg-sky-300/50 blur-[100px]"
        aria-hidden="true"
      />

      <div className="flex-1 flex items-center justify-center w-full relative z-10">
        <div className="w-full max-w-[1080px] rounded-[2rem] bg-white/95 backdrop-blur border border-white/60 premium-shadow overflow-hidden grid lg:grid-cols-[1.05fr_1fr]">
          {/* ── Form column ── */}
          <div className="p-5 sm:p-10 xl:p-14 flex flex-col">
            {/* Back — returns to the page the user came from */}
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white pl-2 pr-3.5 py-1.5 text-[13px] font-semibold text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Go back to the previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back
            </button>



            {/* Heading */}
            <div className="text-center mt-8 lg:mt-12">
              <h1 className="animate-fade-up text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {heading}
              </h1>
              <p className="animate-fade-up text-slate-500 text-sm mt-1.5">
                {subheading}
              </p>
            </div>

            {/* Page-specific form + extras */}
            <div className="mt-8 lg:mt-10">{children}</div>

            {/* Shared social row */}
            <div className="mt-8">
              <div className="flex items-center gap-4 mb-4" role="separator">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">
                  Or login with
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SOCIALS.map(({ name, svg }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => comingSoon(name)}
                    title={`${name} sign-in — coming soon`}
                    className="h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-indigo-200 transition-all active:scale-[0.97]"
                  >
                    {svg}
                    <span className="sr-only">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Orbit panel ── */}
          {/* ── Orbit panel — desktop only; mobile keeps the clean form card ── */}
          <div className="hidden lg:block p-3 lg:p-4">
            <div className="animate-card-rise relative overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-100 flex flex-col items-center p-6 sm:p-8 min-h-[340px] h-full">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center max-w-xs tracking-tight">
                {panelTitle}
              </h2>

              <div className="relative mx-auto w-full max-w-[300px] aspect-square my-auto">
                {/* Glow behind center */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-white/50 blur-2xl"
                  aria-hidden="true"
                />

                {/* Static rings (30% & 72% radius) */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-200/70"
                  style={{ width: RING_WIDTH[0], aspectRatio: "1 / 1" }}
                />
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-200/70"
                  style={{ width: RING_WIDTH[2], aspectRatio: "1 / 1" }}
                />

                {/* Rotating ring — carries its chips in orbit */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-200/70"
                  style={{
                    width: RING_WIDTH[1],
                    aspectRatio: "1 / 1",
                    animation: "spin-slow 70s linear infinite",
                  }}
                >
                  {ORBIT_CHIPS.filter((c) => c.ring === 1).map((c) => (
                    <OrbitChip key={c.angle} {...c} />
                  ))}
                </div>

                {/* Static chips on rings 0 & 2 */}
                {ORBIT_CHIPS.filter((c) => c.ring !== 1).map((c) => (
                  <OrbitChip key={c.angle} {...c} />
                ))}

                {/* Center tile */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center">
                  <Rocket className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
                </div>
              </div>

              <p className="text-center text-xs sm:text-[13px] text-slate-500 max-w-xs leading-relaxed mt-4">
                {panelCaption}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Under-card footer */}
      <div className="relative z-10 mt-6 flex items-center justify-center gap-4 sm:gap-5 flex-wrap text-xs text-slate-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-semibold hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to home
        </Link>
        <span className="text-slate-300" aria-hidden="true">|</span>
        <Link href="/privacy" className="hover:text-slate-800 transition-colors">
          Privacy Policy
        </Link>
        <span className="text-slate-300" aria-hidden="true">|</span>
        <Link href="/terms" className="hover:text-slate-800 transition-colors">
          Terms of Service
        </Link>
      </div>

      {/* Social "coming soon" toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[350] w-[calc(100%-2rem)] max-w-sm">
          <div
            className="animate-fade-in rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg border border-indigo-100 text-indigo-600 bg-white/90 backdrop-blur flex items-start justify-between gap-3"
            role="status"
            aria-live="polite"
          >
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
