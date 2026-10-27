import { describe, it, expect } from "vitest";
import {
  FREE_DAILY_LESSON_LIMIT,
  QUIZ_UNLOCK_PERCENT,
  readLearningData,
  flattenCatalog,
  flattenPathLessons,
  nextIncompleteLesson,
  quizUnlockState,
  formatXp,
  dailyLimitCopy,
  isValidLessonContent,
  learningErrorCode,
  learnErrorMessage,
} from "./learning";

describe("readLearningData", () => {
  it("unwraps the { success, data } envelope", () => {
    expect(readLearningData({ success: true, data: { xp: 10 } })).toEqual({ xp: 10 });
  });

  it("passes bare bodies through", () => {
    expect(readLearningData({ technologies: [] })).toEqual({ technologies: [] });
  });

  it("returns null for success:false (500-swallowing interceptor shape)", () => {
    expect(readLearningData({ success: false, message: "boom" })).toBeNull();
  });

  it("returns null for junk payloads", () => {
    expect(readLearningData(null)).toBeNull();
    expect(readLearningData("nope")).toBeNull();
  });
});

describe("flattenCatalog", () => {
  const technologies = [
    {
      _id: "t1",
      name: "React",
      category: "Frontend",
      paths: [{ _id: "p1", title: "React Basics" }, { _id: "p2", title: "Hooks in Depth" }],
    },
    { _id: "t2", name: "Python", category: "Backend", paths: [{ _id: "p3", title: "Python 101" }] },
  ];

  it("flattens every technology's paths into one list with tech context", () => {
    const flat = flattenCatalog(technologies);
    expect(flat).toHaveLength(3);
    expect(flat[0]).toMatchObject({
      _id: "p1",
      title: "React Basics",
      technologyId: "t1",
      technologyName: "React",
    });
    expect(flat[2]).toMatchObject({ _id: "p3", technologyName: "Python" });
  });

  it("skips technologies without a paths array and junk entries", () => {
    expect(flattenCatalog([{ _id: "t9", name: "Go" }, null, "x"])).toEqual([]);
  });

  it("returns [] for invalid input", () => {
    expect(flattenCatalog(undefined)).toEqual([]);
    expect(flattenCatalog({})).toEqual([]);
  });
});

describe("flattenPathLessons / nextIncompleteLesson", () => {
  const path = {
    modules: [
      { _id: "m1", title: "Fundamentals", lessons: [
        { _id: "l1", title: "Intro", completed: true },
        { _id: "l2", title: "Core concepts", completed: false },
      ] },
      { _id: "m2", title: "Advanced", lessons: [
        { _id: "l3", title: "Patterns", completed: false },
      ] },
    ],
  };

  it("flattens lessons in module order with totals", () => {
    const entries = flattenPathLessons(path);
    expect(entries.map((e) => e.lesson._id)).toEqual(["l1", "l2", "l3"]);
    expect(entries[2]).toMatchObject({ moduleIndex: 1, lessonIndex: 0, index: 2, total: 3 });
  });

  it("finds the first incomplete lesson", () => {
    expect(nextIncompleteLesson(path)?.lesson._id).toBe("l2");
  });

  it("returns null when everything is complete or the path is empty", () => {
    const done = { modules: [{ lessons: [{ _id: "l1", completed: true }] }] };
    expect(nextIncompleteLesson(done)).toBeNull();
    expect(nextIncompleteLesson({})).toBeNull();
    expect(nextIncompleteLesson(null)).toBeNull();
    expect(flattenPathLessons(null)).toEqual([]);
  });
});

describe("quizUnlockState", () => {
  it("unlocks at >= 80% progress", () => {
    expect(quizUnlockState(80).unlocked).toBe(true);
    expect(quizUnlockState(100).unlocked).toBe(true);
    expect(quizUnlockState(QUIZ_UNLOCK_PERCENT - 1).unlocked).toBe(false);
    expect(quizUnlockState(0).unlocked).toBe(false);
  });

  it("treats junk progress as 0 and clamps out-of-range values", () => {
    expect(quizUnlockState(undefined).unlocked).toBe(false);
    expect(quizUnlockState("90").unlocked).toBe(false);
    expect(quizUnlockState(-5).progressPercent).toBe(0);
    expect(quizUnlockState(150).progressPercent).toBe(100);
  });

  it("echoes a numeric passing score and nulls junk", () => {
    expect(quizUnlockState(50, 75).passingScore).toBe(75);
    expect(quizUnlockState(50, "high").passingScore).toBeNull();
    expect(quizUnlockState(50).passingScore).toBeNull();
  });
});

describe("formatXp", () => {
  it("formats numbers with locale separators", () => {
    expect(formatXp(1250)).toBe("1,250 XP");
    expect(formatXp(0)).toBe("0 XP");
    expect(formatXp(10.4)).toBe("10 XP");
  });

  it("returns null for junk", () => {
    expect(formatXp(undefined)).toBeNull();
    expect(formatXp("100")).toBeNull();
    expect(formatXp(NaN)).toBeNull();
  });
});

describe("dailyLimitCopy", () => {
  it("reports remaining lessons on the Free plan", () => {
    expect(dailyLimitCopy(2)).toBe(`2 of ${FREE_DAILY_LESSON_LIMIT} lessons left today (Free plan)`);
  });

  it("reports an honest exhausted state", () => {
    expect(dailyLimitCopy(0)).toBe(
      `You've used all ${FREE_DAILY_LESSON_LIMIT} Free plan lessons for today — come back tomorrow.`,
    );
  });

  it("clamps negatives and floors fractions", () => {
    expect(dailyLimitCopy(-1)).toContain("come back tomorrow");
    expect(dailyLimitCopy(2.9)).toBe(`2 of ${FREE_DAILY_LESSON_LIMIT} lessons left today (Free plan)`);
  });

  it("falls back to plan copy when the entitlement is missing", () => {
    expect(dailyLimitCopy(undefined)).toBe(
      `Free plan: up to ${FREE_DAILY_LESSON_LIMIT} lessons per day.`,
    );
  });
});

describe("isValidLessonContent", () => {
  const valid = {
    intro: "Welcome.",
    sections: [
      { heading: "Basics", paragraphs: ["One.", "Two."], list: ["a", "b"], code: { lang: "js", text: "const x = 1;" } },
    ],
    takeaways: ["Learned it"],
  };

  it("accepts the documented content structure", () => {
    expect(isValidLessonContent(valid)).toBe(true);
  });

  it("accepts minimal content without optional fields", () => {
    expect(isValidLessonContent({
      intro: "Hi",
      sections: [{ heading: "S", paragraphs: ["p"] }],
    })).toBe(true);
  });

  it("rejects missing intro, sections, headings and paragraphs", () => {
    expect(isValidLessonContent({ ...valid, intro: "  " })).toBe(false);
    expect(isValidLessonContent({ intro: "Hi", sections: [] })).toBe(false);
    expect(isValidLessonContent({ ...valid, sections: [{ heading: "", paragraphs: ["p"] }] })).toBe(false);
    expect(isValidLessonContent({ ...valid, sections: [{ heading: "H", paragraphs: [] }] })).toBe(false);
    expect(isValidLessonContent({ ...valid, sections: [{ heading: "H", paragraphs: [42] }] })).toBe(false);
  });

  it("rejects malformed optional fields", () => {
    expect(isValidLessonContent({ ...valid, sections: [{ ...valid.sections[0], list: "nope" }] })).toBe(false);
    expect(isValidLessonContent({ ...valid, sections: [{ ...valid.sections[0], code: { text: 5 } }] })).toBe(false);
    expect(isValidLessonContent({ ...valid, takeaways: [null] })).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(isValidLessonContent(null)).toBe(false);
    expect(isValidLessonContent("content")).toBe(false);
  });
});

describe("learningErrorCode / learnErrorMessage", () => {
  it("reads codes from either error nesting", () => {
    expect(learningErrorCode({ data: { error: { code: "FREE_PATH_LIMIT" } } })).toBe("FREE_PATH_LIMIT");
    expect(learningErrorCode({ data: { code: "QUIZ_LOCKED" } })).toBe("QUIZ_LOCKED");
    expect(learningErrorCode({ data: {} })).toBeNull();
    expect(learningErrorCode(undefined)).toBeNull();
  });

  it("gives honest fixed copy for 401/404/network", () => {
    expect(learnErrorMessage({ status: 401 })).toContain("session has expired");
    expect(learnErrorMessage({ status: 404 })).toContain("isn't available on this server yet");
    expect(learnErrorMessage({ status: 0 })).toContain("Couldn't reach the server");
  });

  it("prefers the server message otherwise", () => {
    expect(learnErrorMessage({ status: 403, data: { error: { message: "Locked" } } })).toBe("Locked");
    expect(learnErrorMessage({ status: 500, data: { message: "Server exploded" } })).toBe("Server exploded");
  });
});
