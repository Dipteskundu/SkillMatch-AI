// src/app/skill-test/testHelpers.js
// Pure helpers for the skill-test UX (unit-tested in testHelpers.test.js).

/** Mirror of the server's skill-test limit (server response overrides it). */
export const TIME_LIMIT_SECONDS = 600;

/** "10:00", "9:05", "0:00" — never negative, never NaN. */
export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** An answer is "answered" when an option index is set (0 counts). */
export function isAnswered(value) {
  return value !== null && value !== undefined && value !== "";
}

/** How many of the test's questions have a selected answer. */
export function answeredCount(answers, questions) {
  return questions.filter((q) => isAnswered(answers[q.id])).length;
}

/** 0-100 completion percentage for the progress bar. */
export function progressPercent(answers, questions) {
  if (!questions.length) return 0;
  return Math.round((answeredCount(answers, questions) / questions.length) * 100);
}

/** Visual urgency of the countdown: "normal" | "warning" (<2min) | "critical" (<=1min). */
export function timerTone(secondsRemaining) {
  const safe = Number(secondsRemaining) || 0;
  if (safe <= 60) return "critical";
  if (safe <= 120) return "warning";
  return "normal";
}

/** Human phrasing for the 2h fail cooldown: "in about 2 hours", "now", … */
export function formatRetryIn(nextAttemptAt, now = Date.now()) {
  const ms = new Date(nextAttemptAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return "now";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const minText = `${m} minute${m === 1 ? "" : "s"}`;
  if (h === 0) return `in about ${minText}`;
  return `in about ${h} hour${h === 1 ? "" : "s"}${m ? ` ${minText}` : ""}`;
}
