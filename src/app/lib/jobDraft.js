// lib/jobDraft.js
// Pure helpers for the post-job form: skill chips, AI-draft filling and
// skill extraction from generated requirement lines. UI-free so they can be
// unit-tested.

/**
 * Merge new chips into an existing list, de-duplicating case-insensitively
 * and preserving the existing casing/order.
 * @param {string[]} existing
 * @param {string[]|string} incoming
 * @returns {string[]}
 */
export function mergeChips(existing = [], incoming = []) {
  const list = Array.isArray(incoming) ? incoming : [incoming];
  const out = existing.filter((v) => String(v || "").trim().length > 0);
  const seen = new Set(out.map((v) => String(v).trim().toLowerCase()));

  for (const raw of list) {
    for (const part of String(raw ?? "").split(/[,;\n]+/)) {
      const value = part.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

/** Remove a chip (case-insensitive match on value). */
export function removeChip(existing = [], value) {
  const key = String(value ?? "").trim().toLowerCase();
  return existing.filter((v) => String(v).trim().toLowerCase() !== key);
}

/** Newline/comma separated textarea -> clean array of lines. */
export function linesToList(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Array -> newline separated textarea value. */
export function listToLines(list) {
  return (Array.isArray(list) ? list : []).filter(Boolean).join("\n");
}

// Requirement lines that name skills, e.g. "Hands-on experience with React, Node.js"
const SKILL_CUE =
  /\b(?:experience with|proficiency in|familiarity with|knowledge of|understanding of|grasp of|expertise in|skills? in|worked with)\s+(.+)$/i;

const CONJUNCTION_SPLIT = /\s*(?:,|;|\/|&|\band\b|\+|\(|\))\s*/i;

// "Docker is a plus" / "Kubernetes preferred" → keep only the skill part.
const TRAILING_CLAUSE =
  /\s+(?:is\s+)?(?:a\s+)?(?:plus|bonus|preferred|preferred\s+experience|desirable|desired|nice\s+to\s+have)\s*$/i;

/**
 * Pull skill-looking mentions out of generated requirement lines.
 * Deliberately conservative: only text after a skill cue is considered, and
 * long prose fragments are dropped.
 * @param {string[]} lines
 * @returns {string[]}
 */
export function extractSkillMentions(lines = []) {
  const found = [];
  for (const line of Array.isArray(lines) ? lines : []) {
    const text = String(line || "").trim();
    if (!text) continue;

    const match = text.match(SKILL_CUE);
    const tail = match ? match[1] : text;
    // A whole line with no cue is only considered when it reads like a list.
    if (!match && (tail.length > 60 || /(^|\s)(?:you|we|our|the)\s/i.test(tail))) continue;

    for (const part of String(tail).split(CONJUNCTION_SPLIT)) {
      const value = part
        .replace(/^[\s\-•*]+/, "")
        .replace(/[.:]+$/, "")
        .replace(TRAILING_CLAUSE, "")
        .trim();
      if (!value || value.length < 2 || value.length > 40) continue;
      if (!/[a-z]/i.test(value)) continue;
      found.push(value);
    }
  }
  return found;
}

/**
 * One-click skill suggestions for the recruiter: everything the AI proposed as
 * nice-to-have plus skills named in the generated requirements, minus what is
 * already on the form.
 *
 * @param {{niceToHave?: string[], requirements?: string[], exclude?: string[]}} input
 * @returns {string[]}
 */
export function suggestSkills({ niceToHave = [], requirements = [], exclude = [] } = {}) {
  const skip = new Set(exclude.map((v) => String(v || "").trim().toLowerCase()));
  const suggestions = [];

  for (const value of [...(niceToHave || []), ...extractSkillMentions(requirements)]) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (skip.has(key)) continue;
    skip.add(key);
    suggestions.push(trimmed);
    if (suggestions.length >= 15) break;
  }
  return suggestions;
}
