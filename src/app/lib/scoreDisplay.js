/**
 * Pure helpers for displaying explainable match scores.
 *
 * The backend "fit-v1" scoring returns either:
 *   - new shape:  aiScore = { total, breakdown, weights, evidence, ... }
 *   - legacy:     aiScore = null (application keeps a plain matchScore /
 *     communicationScore), or a plain-number aiScore on older records.
 *
 * Everything here is intentionally defensive so the UI keeps working while
 * the backend deploy lags the frontend deploy.
 */

/** Human labels for the fit-v1 scoring factors. */
export const FACTOR_LABELS = {
    skillMatch: "Skill match",
    assessment: "Assessment",
    experience: "Experience",
    education: "Education",
    additional: "Other",
};

/**
 * Documented fallback weights — must match the backend's fit-v1 defaults:
 * Skill match 45% / Assessment 25% / Experience 15% / Education 10% / Other 5%.
 */
export const DEFAULT_WEIGHTS = {
    skillMatch: 45,
    assessment: 25,
    experience: 15,
    education: 10,
    additional: 5,
};

/**
 * Resolve the fit score for an application-like object.
 * Handles: legacy numeric aiScore, new aiScore.total, plain matchScore.
 * Returns null (not 0) when the application hasn't been scored yet.
 */
export function applicationScore(app) {
    if (!app) return null;
    if (typeof app.aiScore === "number") return app.aiScore; // legacy
    if (typeof app.aiScore?.total === "number") return app.aiScore.total;
    if (typeof app.matchScore === "number") return app.matchScore;
    return null;
}

/**
 * Color band for a score: ≥80 green, 50–79 amber, <50 slate,
 * null → "Not scored". Returns tailwind classes + short copy.
 */
export function scoreBand(score) {
    if (typeof score !== "number") {
        return {
            key: "none",
            label: "Not scored",
            className: "text-slate-500 bg-slate-100 border-slate-200",
            textClass: "text-slate-500",
        };
    }
    if (score >= 80) {
        return {
            key: "strong",
            label: "Strong match",
            className: "text-emerald-600 bg-emerald-50 border-emerald-200",
            textClass: "text-emerald-600",
        };
    }
    if (score >= 50) {
        return {
            key: "good",
            label: "Good match",
            className: "text-amber-600 bg-amber-50 border-amber-200",
            textClass: "text-amber-600",
        };
    }
    return {
        key: "low",
        label: "Low match",
        className: "text-slate-500 bg-slate-100 border-slate-200",
        textClass: "text-slate-500",
    };
}

/**
 * Turn a score object ({ breakdown, weights }) into ordered display rows.
 * A factor with a null breakdown value is marked `assessed: false` so the UI
 * can say "Not required / not assessed" instead of pretending it scored 0.
 * Returns [] for legacy payloads without a breakdown.
 */
export function breakdownRows(score) {
    if (!score || typeof score.breakdown !== "object" || score.breakdown === null) {
        return [];
    }
    const weights = { ...DEFAULT_WEIGHTS, ...(score.weights || {}) };
    const factors = [...new Set([...Object.keys(weights), ...Object.keys(score.breakdown)])];
    return factors.map((factor) => {
        const raw = score.breakdown[factor];
        const value = typeof raw === "number" ? raw : null;
        return {
            factor,
            label: FACTOR_LABELS[factor] || factor,
            score: value,
            weight: typeof weights[factor] === "number" ? weights[factor] : 0,
            assessed: value !== null,
        };
    });
}

/**
 * Top contributing factors, ranked by (score/100 × weight) — i.e. how much
 * each factor actually moved the total. Used for the compact preview chips.
 */
export function topContributors(score, count = 2) {
    return breakdownRows(score)
        .filter((row) => row.assessed)
        .map((row) => ({ ...row, contribution: (row.score / 100) * row.weight }))
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, count);
}

/**
 * Real ranking weights from the API (first application that carries
 * aiScore.weights), else the documented fit-v1 fallback.
 */
export function rankingWeights(applications) {
    const withWeights = (applications || []).find(
        (app) => app?.aiScore?.weights && typeof app.aiScore.weights === "object",
    );
    return withWeights?.aiScore?.weights || DEFAULT_WEIGHTS;
}

/**
 * Normalize adjacent-skill entries. New shape: { candidateSkill, jobSkill,
 * credit }. Legacy shape: plain strings.
 */
export function normalizeAdjacentSkills(adjacent) {
    if (!Array.isArray(adjacent)) return [];
    return adjacent
        .map((item) => {
            if (typeof item === "string") {
                return { candidateSkill: item, jobSkill: null, credit: null };
            }
            if (item && typeof item === "object" && item.candidateSkill) {
                return {
                    candidateSkill: item.candidateSkill,
                    jobSkill: item.jobSkill || null,
                    credit: typeof item.credit === "number" ? item.credit : null,
                };
            }
            return null;
        })
        .filter(Boolean);
}
