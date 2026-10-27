import { NextResponse } from "next/server";

/**
 * Lightweight route-guard middleware.
 *
 * ── SECURITY MODEL (read before changing) ─────────────────────────────
 * Middleware runs on the Edge runtime and cannot verify a Firebase ID token
 * against the backend here. Instead, the client writes short-lived marker
 * cookies (`sm_session` + `sm_role`) on sign-in — see
 * `src/app/lib/sessionCookie.js`. Those cookies are forgeable from the
 * browser, so this middleware is a CONVENIENCE gate (prevents accidental
 * dead-ends for signed-out users / wrong-role navigation) and nothing more.
 * Real enforcement requires backend authorization against the verified ID
 * token (later phase). Checks are fail-closed: a missing or unrecognized
 * role cookie sends the user to /signin.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/applications",
  "/applicants",
  "/post-job",
  "/my-jobs",
  "/shortlisted",
  "/task-assignment",
  "/task-submissions",
  "/my-tasks",
  "/interviews",
  "/my-interviews",
  "/calendar",
  "/saved-jobs",
  "/profile",
  "/admin",
  "/copilot",
];

const RECRUITER_ONLY = [
  "/post-job",
  "/applicants",
  "/my-jobs",
  "/shortlisted",
  "/task-assignment",
  "/task-submissions",
  "/final-selected",
  "/interview-selected",
  "/interview-completed",
  "/copilot",
];

const ADMIN_ONLY = ["/admin"];

const CANDIDATE_ONLY = [
  "/skill-test",
  "/verification",
  "/communication",
  "/skill-gap-analysis",
  "/resume",
  "/dashboard/learning",
];

const VALID_ROLES = ["candidate", "recruiter", "admin"];

function matchesPrefix(pathname, prefixes) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  const needsAuth =
    matchesPrefix(pathname, PROTECTED_PREFIXES) ||
    matchesPrefix(pathname, CANDIDATE_ONLY);
  if (!needsAuth) {
    return NextResponse.next();
  }

  const role = request.cookies.get("sm_role")?.value;
  const hasSessionMarker = Boolean(request.cookies.get("sm_session")?.value);

  // Fail-closed: no marker or unknown role → sign in (with return path).
  if (!hasSessionMarker || !VALID_ROLES.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?redirect=${encodeURIComponent(`${pathname}${search || ""}`)}`;
    return NextResponse.redirect(url);
  }

  if (matchesPrefix(pathname, ADMIN_ONLY) && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (matchesPrefix(pathname, RECRUITER_ONLY) && role === "candidate") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (matchesPrefix(pathname, CANDIDATE_ONLY) && role === "recruiter") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Only run on real app routes; skip API proxy, Next internals and files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)"],
};
