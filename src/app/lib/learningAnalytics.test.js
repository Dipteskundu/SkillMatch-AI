import { describe, expect, it } from "vitest";
import {
  deriveWeeklyBuckets,
  computeWeeklyStreak,
  averageBy,
  topAttempts,
} from "./learningAnalytics";

// "Today" can't be frozen without mocking Date, so these tests assert
// properties that hold whenever they run (bucket count, aggregation,
// totals), not absolute labels.

describe("deriveWeeklyBuckets", () => {
  it("always returns 8 weekly buckets with stripped internals", () => {
    const weekly = deriveWeeklyBuckets([], []);
    expect(weekly).toHaveLength(8);
    weekly.forEach((w) => {
      expect(w.lessons).toBe(0);
      expect(w.minutes).toBe(0);
      expect(w.assessments).toBe(0);
      expect(typeof w.label).toBe("string");
      expect(w._start).toBeUndefined();
      expect(w._end).toBeUndefined();
    });
  });

  it("aggregates today's lessons into the current week (last bucket)", () => {
    const iso = new Date().toISOString().slice(0, 10);
    const weekly = deriveWeeklyBuckets(
      [
        { day: iso, lessons: 2, minutes: 30 },
        { day: iso, lessons: 1, minutes: 15 },
      ],
      [],
    );
    const current = weekly[weekly.length - 1];
    expect(current.lessons).toBe(3);
    expect(current.minutes).toBe(45);
  });

  it("counts attempts today as assessments in the current week", () => {
    const now = new Date().toISOString();
    const weekly = deriveWeeklyBuckets([], [{ startedAt: now }, { startedAt: now }]);
    expect(weekly[weekly.length - 1].assessments).toBe(2);
  });

  it("preserves lesson totals when bucketing a week-old day", () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weekly = deriveWeeklyBuckets(
      [{ day: lastWeek.toISOString().slice(0, 10), lessons: 5, minutes: 60 }],
      [],
    );
    expect(weekly.reduce((n, w) => n + w.lessons, 0)).toBe(5);
    expect(weekly.reduce((n, w) => n + w.minutes, 0)).toBe(60);
    // Never in the current week — it's a week old, whatever the weekday edge.
    expect(weekly[weekly.length - 1].lessons).toBeLessThanOrEqual(5);
  });
});

describe("computeWeeklyStreak", () => {
  const idle = () => ({ lessons: 0, assessments: 0 });

  it("counts consecutive active weeks back from the current week", () => {
    const weekly = [
      idle(),
      { lessons: 1, assessments: 0 },
      { lessons: 0, assessments: 1 },
      { lessons: 2, assessments: 0 },
    ];
    expect(computeWeeklyStreak(weekly)).toBe(3);
  });

  it("breaks on an inactive current week", () => {
    const weekly = [{ lessons: 2, assessments: 1 }, { lessons: 3, assessments: 0 }, idle()];
    expect(computeWeeklyStreak(weekly)).toBe(0);
  });

  it("returns 0 for empty or all-idle input", () => {
    expect(computeWeeklyStreak([])).toBe(0);
    expect(computeWeeklyStreak([idle(), idle()])).toBe(0);
  });
});

describe("averageBy", () => {
  const attempts = [
    { skill: "React", score: 80 },
    { skill: "React", score: 60 },
    { skill: "CSS", score: 40 },
    { skill: "React", score: null }, // unscored — ignored
  ];

  it("averages per group, ignores null scores, rounds, sorts best first", () => {
    expect(averageBy(attempts, "skill")).toEqual([
      { key: "React", count: 2, average: 70 },
      { key: "CSS", count: 1, average: 40 },
    ]);
  });

  it("falls back to Unknown for missing keys and handles empty input", () => {
    expect(averageBy([{ score: 50 }], "skill")).toEqual([
      { key: "Unknown", count: 1, average: 50 },
    ]);
    expect(averageBy([], "skill")).toEqual([]);
  });
});

describe("topAttempts", () => {
  it("filters unscored, sorts by score desc, caps at n", () => {
    const attempts = [
      { skill: "A", score: 50, startedAt: "2026-01-01" },
      { skill: "B", score: 90, startedAt: "2026-01-02" },
      { skill: "C", score: null }, // ignored
      { skill: "D", score: 70, startedAt: "2026-03-01" },
      { skill: "E", score: 70, startedAt: "2026-02-01" },
    ];
    expect(topAttempts(attempts, 2)).toEqual([
      { skill: "B", score: 90, startedAt: "2026-01-02" },
      { skill: "D", score: 70, startedAt: "2026-03-01" }, // tie → most recent first
    ]);
  });

  it("handles empty input", () => {
    expect(topAttempts([], 3)).toEqual([]);
  });
});
