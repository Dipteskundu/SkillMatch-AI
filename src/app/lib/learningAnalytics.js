/**
 * Pure derivations for the My Assessments dashboard overview.
 * Kept out of the page component so they can be unit-tested.
 */

/**
 * Bucket activity into the last 8 Monday-started weeks.
 * @param {Array<{day:"YYYY-MM-DD", lessons:number, minutes:number}>} activity
 *   Server rows from GET /api/v1/learning/my-plans (activity field).
 * @param {Array<{startedAt:string, submittedAt:string}>} attempts
 *   Attempt summaries; only their dates contribute to `assessments`.
 * @returns {Array<{label:string, lessons:number, minutes:number, assessments:number}>}
 *   Oldest week first; the current week is last.
 */
export function deriveWeeklyBuckets(activity, attempts) {
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // Monday of this week

  const weeks = [];
  for (let i = 7; i >= 0; i -= 1) {
    const start = new Date(monday);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    weeks.push({
      // Not returned: start/end are kept only for bucketing.
      _start: start,
      _end: end,
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      lessons: 0,
      minutes: 0,
      assessments: 0,
    });
  }

  const within = (date) => weeks.find((w) => date >= w._start && date < w._end);

  for (const a of activity || []) {
    const day = new Date(`${a.day}T00:00:00`);
    const week = within(day);
    if (week) {
      week.lessons += a.lessons || 0;
      week.minutes += a.minutes || 0;
    }
  }
  for (const at of attempts || []) {
    const date = new Date(at.startedAt || at.submittedAt);
    const week = within(date);
    if (week) week.assessments += 1;
  }

  return weeks.map(({ _start, _end, ...rest }) => rest);
}

/**
 * Consecutive active weeks counting back from the current week.
 * An empty current week breaks the streak (it resumes counting when you do).
 * @param {Array<{lessons:number, assessments:number}>} weekly oldest-first
 */
export function computeWeeklyStreak(weekly) {
  let streak = 0;
  for (let i = (weekly?.length || 0) - 1; i >= 0; i -= 1) {
    if (weekly[i].lessons + weekly[i].assessments > 0) streak += 1;
    else break;
  }
  return streak;
}

/**
 * Average score grouped by an attempt field (e.g. "skill", "type").
 * Unscored attempts (in-progress) are ignored.
 * @returns {Array<{key:string, count:number, average:number}>} best average first
 */
export function averageBy(attempts, key) {
  const groups = new Map();
  for (const a of attempts || []) {
    if (typeof a.score !== "number") continue;
    const k = String(a[key] || "Unknown");
    const g = groups.get(k) || { key: k, count: 0, total: 0 };
    g.count += 1;
    g.total += a.score;
    groups.set(k, g);
  }
  return [...groups.values()]
    .map((g) => ({ key: g.key, count: g.count, average: Math.round(g.total / g.count) }))
    .sort((a, b) => b.average - a.average);
}

/**
 * Highest-scoring attempts. Ties break toward the most recent attempt.
 * @param {Array} attempts raw summary attempts (unscored ones are filtered)
 * @param {number} n how many to keep
 */
export function topAttempts(attempts, n = 5) {
  return [...(attempts || [])]
    .filter((a) => typeof a.score === "number")
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.startedAt || 0) - new Date(a.startedAt || 0),
    )
    .slice(0, n);
}
