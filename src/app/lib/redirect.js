/**
 * Safe post-auth redirect handling (LH-004).
 *
 * Only same-origin, in-app paths are allowed. Anything else (absolute URLs,
 * protocol-relative "//host", backslash tricks, control chars) falls back to "/".
 */
const FALLBACK = "/";

export function safeRedirectPath(raw) {
  if (typeof raw !== "string") return FALLBACK;

  const value = raw.trim();
  if (!value) return FALLBACK;

  // Must be a single-slash in-app path: "/jobs", "/learning-hub/paths/abc"
  if (!value.startsWith("/")) return FALLBACK;
  // Protocol-relative ("//evil.com") or backslash-escaped variants.
  if (value.startsWith("//") || value.startsWith("/\\")) return FALLBACK;

  // Drop the fragment: "/learn#top" -> "/learn"
  const hashIndex = value.indexOf("#");
  const withoutHash = hashIndex === -1 ? value : value.slice(0, hashIndex);

  // Reject control characters (covers embedded CR/LF and null bytes).
  for (let i = 0; i < withoutHash.length; i += 1) {
    if (withoutHash.charCodeAt(i) < 32) return FALLBACK;
  }

  return withoutHash || FALLBACK;
}

/** Build the sign-in URL that returns the user to `currentPath` afterwards. */
export function signInUrlWithReturn(currentPath) {
  const target = safeRedirectPath(currentPath);
  return target === FALLBACK
    ? "/signin"
    : `/signin?redirect=${encodeURIComponent(target)}`;
}

/**
 * Resolve where to send the user after a successful sign-in / sign-up.
 * Reads `?redirect=` from the current URL without useSearchParams, which would
 * force a Suspense boundary on these pages.
 */
export function postLoginPath() {
  if (typeof window === "undefined") return FALLBACK;
  const params = new URLSearchParams(window.location.search);
  return safeRedirectPath(params.get("redirect"));
}
