// Client-side helper for the lightweight route-guard marker cookies read by
// the root `middleware.js`.
//
// SECURITY NOTE: these cookies are a CONVENIENCE gate (UX routing), NOT
// security. They are written from client JS, are trivially forgeable, and
// carry no server-verified identity. Real authorization must be enforced
// backend against the Firebase ID token (later phase).

const ROLE_COOKIE = "sm_role";
const SESSION_COOKIE = "sm_session";

// Short-lived marker; refreshed whenever the auth state is (re)loaded.
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

const VALID_ROLES = ["candidate", "recruiter", "admin"];

function writeCookie(name, value) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}

/** Called after a successful sign-in/sign-up once the role is known. */
export function setAuthSessionCookies(role) {
  const safeRole = VALID_ROLES.includes(role) ? role : "candidate";
  writeCookie(SESSION_COOKIE, String(Date.now()));
  writeCookie(ROLE_COOKIE, safeRole);
}

/** Called on sign-out / when the Firebase session ends. */
export function clearAuthSessionCookies() {
  if (typeof document === "undefined") return;
  for (const name of [ROLE_COOKIE, SESSION_COOKIE]) {
    document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
  }
}
