"use client";

/**
 * Shared API helpers for the Learning Hub.
 * Uses the central axios instance so Firebase tokens attach automatically
 * and the Next.js rewrite proxy avoids CORS.
 */
import api from "./apiClient";

export async function fetchPaths(params = {}) {
  const { data } = await api.get("/api/v1/learning/paths", { params });
  return data?.data ?? [];
}

export async function fetchPath(idOrSlug) {
  const { data } = await api.get(`/api/v1/learning/paths/${encodeURIComponent(idOrSlug)}`);
  return data?.data ?? null;
}

/** Human-readable duration from a path's estimated hours. */
export function formatDuration(path) {
  if (path?.estimatedDuration) return path.estimatedDuration;
  const hours = Number(path?.estimatedHours);
  if (!Number.isFinite(hours) || hours <= 0) return "Self-paced";
  if (hours < 24) return `${hours} hours`;
  const weeks = Math.max(1, Math.round(hours / 8));
  return `${weeks} weeks`;
}

/** Axios error → a message safe to display. */
export function apiErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  return err?.response?.data?.message || fallback;
}

// ── Plans (Phase 2: LH-005 / LH-006 / LH-007 / LH-009) ────────────

/** Idempotent: a second call returns the existing plan with created:false. */
export async function enrollInPath(pathId) {
  const { data } = await api.post("/api/v1/learning/enrollments", { pathId });
  return data?.data ?? null;
}

/** Throws with a `.response` so callers can surface apiErrorMessage(). */
export async function generatePlan(answers) {
  const { data } = await api.post("/api/v1/learning/plans/generate", answers);
  return data?.data ?? null;
}

export async function fetchMyPlans() {
  const { data } = await api.get("/api/v1/learning/my-plans");
  return data?.data ?? [];
}

export async function updatePlan(planId, patch) {
  const { data } = await api.patch(
    `/api/v1/learning/plans/${encodeURIComponent(planId)}`,
    patch,
  );
  return data?.data ?? null;
}

export async function regeneratePlan(planId, moduleIndexes) {
  const { data } = await api.post(
    `/api/v1/learning/plans/${encodeURIComponent(planId)}/regenerate`,
    { moduleIndexes },
  );
  return data?.data ?? null;
}

export async function startDiagnostic(assessmentSlug, learningPlanId) {
  const { data } = await api.post(
    `/api/v1/learning/assessments/${encodeURIComponent(assessmentSlug)}/start`,
    { learningPlanId },
  );
  return data?.data ?? null;
}

export async function submitAttempt(attemptId, answers) {
  const { data } = await api.post(
    `/api/v1/learning/attempts/${encodeURIComponent(attemptId)}/submit`,
    { answers },
  );
  return data?.data ?? null;
}

export async function fetchAttemptResults(attemptId) {
  const { data } = await api.get(
    `/api/v1/learning/attempts/${encodeURIComponent(attemptId)}/results`,
  );
  return data?.data ?? null;
}

// ── Lessons (Phase 3: LH-010/011/018) ──────────────────────────────
export async function fetchLesson(lessonId, opts = {}) {
  // opts.auth: true → verifyToken; false/undefined → optionalVerifyToken (guest preview)
  const headers = {};
  if (opts?.auth) {
    // The apiClient attaches the Firebase token automatically via AuthContext
    // No extra header needed — the Next rewrite proxy forwards the auth cookie/token
  }
  const { data } = await api.get(
    `/api/v1/learning/lessons/${encodeURIComponent(lessonId)}`,
    { headers },
  );
  return data?.data ?? null;
}

export async function askLessonQuestion(lessonId, question) {
  const { data } = await api.post(
    `/api/v1/learning/lessons/${encodeURIComponent(lessonId)}/ask`,
    { question },
  );
  return data?.data ?? null;
}

export async function submitLessonKnowledgeCheck(lessonId, selectedIndex) {
  const { data } = await api.post(
    `/api/v1/learning/lessons/${encodeURIComponent(lessonId)}/knowledge-check`,
    { selectedIndex },
  );
  return data?.data ?? null;
}

export async function reportLessonIssue(lessonId, reason) {
  const { data } = await api.post(
    `/api/v1/learning/lessons/${encodeURIComponent(lessonId)}/report`,
    { reason },
  );
  return data?.data ?? null;
}

export async function updateLessonProgress(lessonId, completed, timeSpent) {
  const { data } = await api.patch(
    `/api/v1/learning/progress`,
    { lessonId, completed, timeSpent },
  );
  return data?.data ?? null;
}
