// lib/learning.js
// Pure helpers for the SkillForge Learning Hub (Phase 4).
//
// The learning backend is deployed independently from this frontend, so every
// helper here is defensive: malformed or missing fields degrade to honest
// defaults instead of throwing or fabricating progress.

/** Free plan: one active path + this many lessons per day (PLAN.md Tier-3). */
export const FREE_DAILY_LESSON_LIMIT = 3;
export const FREE_ACTIVE_PATH_LIMIT = 1;
/** Lessons-completion percentage required before the quiz unlocks. */
export const QUIZ_UNLOCK_PERCENT = 80;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

/**
 * Unwrap an RTK/axios learning payload: `{ success, data }` envelope (or a
 * bare body from older routes). Returns null when the server reported a
 * failure (`success === false` — the apiClient resolves HTTP 500s this way).
 */
export function readLearningData(payload) {
  if (!isObject(payload)) return null;
  if (payload.success === false) return null;
  return isObject(payload.data) ? payload.data : payload;
}

/**
 * Flatten catalog technologies into a single path list, carrying the parent
 * technology's id/name onto each path entry.
 * `flattenCatalog([{ _id, name, paths: [...] }])` →
 *   `[{ ...path, technologyId, technologyName }]`
 */
export function flattenCatalog(technologies) {
  if (!Array.isArray(technologies)) return [];
  const flat = [];
  for (const tech of technologies) {
    if (!isObject(tech)) continue;
    const paths = Array.isArray(tech.paths) ? tech.paths : [];
    for (const path of paths) {
      if (!isObject(path)) continue;
      flat.push({
        ...path,
        technologyId: tech._id ?? null,
        technologyName: typeof tech.name === "string" ? tech.name : "",
      });
    }
  }
  return flat;
}

/**
 * Ordered lesson entries for a path detail payload:
 * `[{ lesson, module, moduleIndex, lessonIndex, index, total }]`.
 */
export function flattenPathLessons(path) {
  if (!isObject(path) || !Array.isArray(path.modules)) return [];
  const entries = [];
  for (const [moduleIndex, mod] of path.modules.entries()) {
    if (!isObject(mod)) continue;
    const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
    for (const [lessonIndex, lesson] of lessons.entries()) {
      if (!isObject(lesson)) continue;
      entries.push({ lesson, module: mod, moduleIndex, lessonIndex, index: entries.length });
    }
  }
  return entries.map((entry) => ({ ...entry, total: entries.length }));
}

/**
 * The next lesson the user hasn't completed yet (first incomplete in module
 * order), or null when every lesson is done / the path has no lessons.
 */
export function nextIncompleteLesson(path) {
  return flattenPathLessons(path).find((entry) => !entry.lesson.completed) || null;
}

/**
 * Quiz unlock state — a quiz unlocks once at least QUIZ_UNLOCK_PERCENT (80%)
 * of the path's lessons are complete. `passingScore` (the score needed to
 * PASS the quiz) is echoed back for display; null when the server didn't say.
 */
export function quizUnlockState(progressPercent, passingScore) {
  const raw = typeof progressPercent === "number" && Number.isFinite(progressPercent)
    ? progressPercent
    : 0;
  const percent = Math.min(100, Math.max(0, raw));
  return {
    unlocked: percent >= QUIZ_UNLOCK_PERCENT,
    requiredPercent: QUIZ_UNLOCK_PERCENT,
    progressPercent: percent,
    passingScore:
      typeof passingScore === "number" && Number.isFinite(passingScore) && passingScore > 0
        ? passingScore
        : null,
  };
}

/** Format an XP total for display: `1,250 XP`. Returns null for junk input. */
export function formatXp(xp) {
  if (typeof xp !== "number" || !Number.isFinite(xp)) return null;
  return `${Math.max(0, Math.round(xp)).toLocaleString("en-US")} XP`;
}

/**
 * Honest copy for the Free plan's daily lesson allowance, driven by the
 * `entitlement.remainingToday` field from the lesson endpoint.
 */
export function dailyLimitCopy(remainingToday) {
  const total = FREE_DAILY_LESSON_LIMIT;
  if (typeof remainingToday !== "number" || !Number.isFinite(remainingToday)) {
    return `Free plan: up to ${total} lessons per day.`;
  }
  const left = Math.max(0, Math.floor(remainingToday));
  if (left === 0) {
    return `You've used all ${total} Free plan lessons for today — come back tomorrow.`;
  }
  return `${left} of ${total} lessons left today (Free plan)`;
}

/**
 * Structure check for the lesson content JSON before we render it:
 * `{ intro, sections: [{ heading, paragraphs, list?, code? }], takeaways? }`.
 * Never render (or trust) content that doesn't match this shape.
 */
export function isValidLessonContent(content) {
  if (!isObject(content)) return false;
  if (typeof content.intro !== "string" || content.intro.trim().length === 0) return false;
  if (!Array.isArray(content.sections) || content.sections.length === 0) return false;

  for (const section of content.sections) {
    if (!isObject(section)) return false;
    if (typeof section.heading !== "string" || section.heading.trim().length === 0) return false;
    if (!isStringArray(section.paragraphs) || section.paragraphs.length === 0) return false;
    if (section.list !== undefined && !isStringArray(section.list)) return false;
    if (
      section.code !== undefined &&
      !(isObject(section.code) && typeof section.code.text === "string")
    ) {
      return false;
    }
  }
  if (content.takeaways !== undefined && !isStringArray(content.takeaways)) return false;
  return true;
}

/**
 * Extract the backend error code (`FREE_PATH_LIMIT`, `DAILY_LESSON_LIMIT`,
 * `QUIZ_LOCKED`, …) from an RTK rejected-query error.
 */
export function learningErrorCode(error) {
  return error?.data?.error?.code || error?.data?.code || null;
}

/**
 * Honest human message for a learning request failure. 401/404/network get
 * fixed copy; everything else prefers the server's own message.
 */
export function learnErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return null;
  if (error.status === 401) return "Your session has expired. Sign in again and retry.";
  if (error.status === 404) return "The Learning Hub isn't available on this server yet.";
  if (!error.status) return "Couldn't reach the server. Check your connection and try again.";
  return (
    error?.data?.error?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
}
