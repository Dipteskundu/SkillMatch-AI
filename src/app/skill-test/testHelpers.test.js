import { describe, it, expect } from "vitest";
import {
  formatCountdown,
  answeredCount,
  progressPercent,
  timerTone,
  formatRetryIn,
} from "./testHelpers";

describe("formatCountdown", () => {
  it("formats minutes and zero-pads seconds", () => {
    expect(formatCountdown(600)).toBe("10:00");
    expect(formatCountdown(605)).toBe("10:05");
    expect(formatCountdown(59)).toBe("0:59");
    expect(formatCountdown(0)).toBe("0:00");
  });

  it("clamps negatives and non-numeric input", () => {
    expect(formatCountdown(-30)).toBe("0:00");
    expect(formatCountdown("abc")).toBe("0:00");
  });
});

describe("answeredCount / progressPercent", () => {
  const questions = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];

  it("counts answered questions (option index 0 counts as answered)", () => {
    expect(answeredCount({}, questions)).toBe(0);
    expect(answeredCount({ q1: 0, q2: 2 }, questions)).toBe(2);
    expect(answeredCount({ q1: 1, q2: "", q3: null }, questions)).toBe(1);
  });

  it("computes a percentage and handles the empty case", () => {
    expect(progressPercent({ q1: 0 }, questions)).toBe(33);
    expect(progressPercent({ q1: 0, q2: 1, q3: 2 }, questions)).toBe(100);
    expect(progressPercent({}, [])).toBe(0);
  });
});

describe("timerTone", () => {
  it("escalates below 2 minutes and turns critical at 1 minute or less", () => {
    expect(timerTone(300)).toBe("normal");
    expect(timerTone(120)).toBe("warning");
    expect(timerTone(61)).toBe("warning");
    expect(timerTone(60)).toBe("critical");
    expect(timerTone(0)).toBe("critical");
  });
});

describe("formatRetryIn", () => {
  it("renders the fail cooldown in hours/minutes", () => {
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
    expect(formatRetryIn(inTwoHours)).toBe("in about 2 hours");

    const inNinety = new Date(Date.now() + 90 * 60 * 1000);
    expect(formatRetryIn(inNinety)).toBe("in about 1 hour 30 minutes");
  });

  it("returns 'now' for past or invalid timestamps", () => {
    expect(formatRetryIn(new Date(Date.now() - 60000))).toBe("now");
    expect(formatRetryIn("not-a-date")).toBe("now");
  });
});
