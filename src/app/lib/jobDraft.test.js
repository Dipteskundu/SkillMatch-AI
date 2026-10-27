import { describe, it, expect } from "vitest";
import {
  mergeChips,
  removeChip,
  linesToList,
  listToLines,
  extractSkillMentions,
  suggestSkills,
} from "./jobDraft";

describe("mergeChips", () => {
  it("adds chips and de-duplicates case-insensitively, keeping existing casing", () => {
    expect(mergeChips(["React"], ["react", "Node.js"])).toEqual(["React", "Node.js"]);
  });

  it("splits comma/semicolon/newline separated input", () => {
    expect(mergeChips([], "TypeScript, MongoDB; GraphQL\nSQL")).toEqual([
      "TypeScript",
      "MongoDB",
      "GraphQL",
      "SQL",
    ]);
  });

  it("ignores blanks and never mutates the input array", () => {
    const existing = ["AWS"];
    const result = mergeChips(existing, ["  ", "AWS", "Docker"]);
    expect(result).toEqual(["AWS", "Docker"]);
    expect(existing).toEqual(["AWS"]);
  });
});

describe("removeChip", () => {
  it("removes by value, case-insensitively", () => {
    expect(removeChip(["React", "Node.js"], "react")).toEqual(["Node.js"]);
  });
});

describe("linesToList / listToLines", () => {
  it("round-trips textarea lines", () => {
    const lines = ["Build features", "Review code"];
    expect(listToLines(lines)).toBe("Build features\nReview code");
    expect(linesToList("Build features\n\n  Review code  \n")).toEqual([
      "Build features",
      "Review code",
    ]);
  });

  it("handles empty input", () => {
    expect(linesToList(undefined)).toEqual([]);
    expect(listToLines(null)).toBe("");
  });
});

describe("extractSkillMentions", () => {
  it("extracts skills after a skill cue", () => {
    expect(
      extractSkillMentions([
        "Hands-on experience with React, Node.js and PostgreSQL",
        "Familiarity with Docker is a plus",
      ]),
    ).toEqual(["React", "Node.js", "PostgreSQL", "Docker"]);
  });

  it("ignores prose lines that do not name skills", () => {
    expect(
      extractSkillMentions([
        "You should be comfortable working in a fast-moving team environment with stakeholders",
        "",
      ]),
    ).toEqual([]);
  });
});

describe("suggestSkills", () => {
  it("unions nice-to-have skills with requirement mentions and excludes existing chips", () => {
    const suggestions = suggestSkills({
      niceToHave: ["Figma", "react"],
      requirements: ["Hands-on experience with React.", "Knowledge of GraphQL"],
      exclude: ["React"],
    });

    expect(suggestions).toEqual(["Figma", "GraphQL"]);
  });

  it("returns an empty list when everything is already on the form", () => {
    expect(
      suggestSkills({ niceToHave: ["AWS"], requirements: ["Experience with AWS"], exclude: ["aws"] }),
    ).toEqual([]);
  });
});
