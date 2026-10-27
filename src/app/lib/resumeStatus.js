// lib/resumeStatus.js
// Pure response-classification helpers for the resume pipeline state machine.
//
// The resume backend is deployed independently from this frontend, so both the
// OLD synchronous upload shape and the NEW queued/async shape must be
// understood here — and the status payload may arrive in more than one nesting.

const ACTIVE_STATUSES = new Set([
  "queued",
  "processing",
  "pending",
  "running",
  "in_progress",
  "in-progress",
  "analyzing",
  "started",
]);

const DONE_STATUSES = new Set(["done", "completed", "complete", "success", "succeeded", "ready", "finished"]);
const FAILED_STATUSES = new Set(["failed", "error", "errored"]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExtractedFields(value) {
  if (!isObject(value)) return false;
  return (
    Array.isArray(value.skills) ||
    Array.isArray(value.technologies) ||
    Array.isArray(value.role_titles) ||
    typeof value.experience_years === "number"
  );
}

/**
 * Classify POST /api/resume/upload.
 * @returns {{kind: "queued"|"ready"|"error", resumeId?: string, result?: object, warning?: string, message?: string}}
 */
export function classifyUploadResponse(payload) {
  const root = isObject(payload) ? payload : {};
  const inner = isObject(root.data) ? root.data : {};

  const extractionStatus =
    root.extractionStatus ?? inner.extractionStatus ?? root.status ?? inner.status;
  const resumeId = root.resumeId ?? inner.resumeId ?? inner.id ?? null;
  const normalized = String(extractionStatus || "").toLowerCase();

  if (ACTIVE_STATUSES.has(normalized)) {
    return { kind: "queued", resumeId: resumeId ? String(resumeId) : undefined };
  }

  // Old synchronous backend: extracted data comes straight back.
  if (hasExtractedFields(inner)) {
    return { kind: "ready", result: inner, warning: root.warning };
  }
  if (hasExtractedFields(root)) {
    return { kind: "ready", result: root, warning: root.warning };
  }

  // Queued without an explicit status (resumeId is enough to start polling).
  if (resumeId && !hasExtractedFields(inner)) {
    return { kind: "queued", resumeId: String(resumeId) };
  }

  const message = root.success === false
    ? (root.message || inner.message || "Resume upload failed. Please try again.")
    : "The server returned an unexpected upload response. Please try again.";
  return { kind: "error", message };
}

/**
 * Classify GET /api/resume/status/:uid.
 * @returns {{kind: "active"|"done"|"failed"|"suspicious"|"unknown", result?: object, injectionFlags?: any[], message?: string}}
 */
export function classifyStatusResponse(payload) {
  const root = isObject(payload) ? payload : {};
  const inner = isObject(root.data) ? root.data : {};
  const scope = inner.status || inner.extractionStatus ? inner : root;

  const rawStatus =
    scope.status ?? scope.extractionStatus ?? root.status ?? root.extractionStatus ?? "";
  const status = String(rawStatus).toLowerCase();

  const injectionFlags = scope.injectionFlags ?? inner.injectionFlags ?? root.injectionFlags ?? null;
  const hasFlags = Array.isArray(injectionFlags) ? injectionFlags.length > 0 : Boolean(injectionFlags);

  const result =
    (isObject(scope.result) && scope.result) ||
    (isObject(scope.extracted) && scope.extracted) ||
    (isObject(scope.resume) && scope.resume) ||
    (hasExtractedFields(scope) ? scope : null) ||
    (hasExtractedFields(inner) ? inner : null) ||
    (hasExtractedFields(root.data) ? root.data : null) ||
    (hasExtractedFields(root) ? root : null) ||
    null;

  if (ACTIVE_STATUSES.has(status)) return { kind: "active" };
  if (FAILED_STATUSES.has(status)) {
    return {
      kind: "failed",
      message: scope.message || root.message || "Resume analysis failed. Please try again.",
    };
  }
  if (DONE_STATUSES.has(status)) {
    if (hasFlags) return { kind: "suspicious", result, injectionFlags };
    return { kind: "done", result };
  }

  // Some deployments may answer with the finished payload and no status.
  if (result) {
    if (hasFlags) return { kind: "suspicious", result, injectionFlags };
    return { kind: "done", result };
  }
  if (injectionFlags) return { kind: "suspicious", result: null, injectionFlags };

  return { kind: "unknown" };
}
