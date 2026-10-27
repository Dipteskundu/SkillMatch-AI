import { describe, it, expect } from "vitest";
import {
  FACTOR_LABELS,
  DEFAULT_WEIGHTS,
  applicationScore,
  scoreBand,
  breakdownRows,
  topContributors,
  rankingWeights,
  normalizeAdjacentSkills,
} from "./scoreDisplay";

describe("applicationScore", () => {
  it("reads the new aiScore.total shape", () => {
    expect(applicationScore({ aiScore: { total: 72 } })).toBe(72);
  });

  it("reads a legacy numeric aiScore", () => {
    expect(applicationScore({ aiScore: 64 })).toBe(64);
  });

  it("falls back to legacy matchScore", () => {
    expect(applicationScore({ aiScore: null, matchScore: 41 })).toBe(41);
  });

  it("returns null (not 0) when unscored", () => {
    expect(applicationScore({ aiScore: null })).toBeNull();
    expect(applicationScore(null)).toBeNull();
    expect(applicationScore({})).toBeNull();
  });
});

describe("scoreBand", () => {
  it("bands ≥80 as strong/green", () => {
    const band = scoreBand(80);
    expect(band.key).toBe("strong");
    expect(band.className).toContain("emerald");
  });

  it("bands 50–79 as good/amber", () => {
    expect(scoreBand(50).key).toBe("good");
    expect(scoreBand(79).key).toBe("good");
    expect(scoreBand(79).className).toContain("amber");
  });

  it("bands <50 as low/slate", () => {
    expect(scoreBand(49).key).toBe("low");
    expect(scoreBand(0).key).toBe("low");
  });

  it("marks null as not scored", () => {
    const band = scoreBand(null);
    expect(band.key).toBe("none");
    expect(band.label).toBe("Not scored");
  });
});

describe("breakdownRows", () => {
  const score = {
    breakdown: { skillMatch: 72, assessment: 50, experience: 60, education: null, additional: null },
    weights: { skillMatch: 45, assessment: 25, experience: 15, education: 10, additional: 5 },
  };

  it("returns a row per factor with label, score and weight", () => {
    const rows = breakdownRows(score);
    expect(rows).toHaveLength(5);
    const skill = rows.find((r) => r.factor === "skillMatch");
    expect(skill.label).toBe(FACTOR_LABELS.skillMatch);
    expect(skill.score).toBe(72);
    expect(skill.weight).toBe(45);
    expect(skill.assessed).toBe(true);
  });

  it("marks null factors as not assessed instead of zero", () => {
    const rows = breakdownRows(score);
    const education = rows.find((r) => r.factor === "education");
    expect(education.assessed).toBe(false);
    expect(education.score).toBeNull();
  });

  it("falls back to documented default weights for missing ones", () => {
    const rows = breakdownRows({
      breakdown: { skillMatch: 80 },
      weights: { skillMatch: 50 },
    });
    const assessment = rows.find((r) => r.factor === "assessment");
    expect(assessment.weight).toBe(DEFAULT_WEIGHTS.assessment);
  });

  it("returns [] for legacy payloads without a breakdown", () => {
    expect(breakdownRows(null)).toEqual([]);
    expect(breakdownRows({ total: 67 })).toEqual([]);
  });
});

describe("topContributors", () => {
  it("ranks assessed factors by contribution to the total", () => {
    const rows = topContributors({
      breakdown: { skillMatch: 72, assessment: 50, experience: 60, education: null },
      weights: { skillMatch: 45, assessment: 25, experience: 15, education: 10 },
    });
    // skillMatch contributes 0.72×45=32.4 > experience 0.60×15=9 > assessment 0.50×25=12.5
    expect(rows.map((r) => r.factor)).toEqual(["skillMatch", "assessment"]);
  });

  it("respects the count argument and skips unassessed factors", () => {
    const rows = topContributors(
      { breakdown: { skillMatch: 90, assessment: null }, weights: { skillMatch: 45, assessment: 25 } },
      1,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].factor).toBe("skillMatch");
  });
});

describe("rankingWeights", () => {
  it("uses real weights from the first application that has them", () => {
    const apps = [
      { aiScore: null },
      { aiScore: { total: 70, weights: { skillMatch: 40, assessment: 30 } } },
    ];
    expect(rankingWeights(apps)).toEqual({ skillMatch: 40, assessment: 30 });
  });

  it("falls back to the documented fit-v1 defaults", () => {
    expect(rankingWeights([])).toBe(DEFAULT_WEIGHTS);
    expect(rankingWeights([{ aiScore: null }])).toBe(DEFAULT_WEIGHTS);
    expect(rankingWeights(undefined)).toBe(DEFAULT_WEIGHTS);
  });
});

describe("normalizeAdjacentSkills", () => {
  it("passes through the new object shape", () => {
    const out = normalizeAdjacentSkills([
      { candidateSkill: "vue.js", jobSkill: "react", credit: 0.6 },
    ]);
    expect(out).toEqual([{ candidateSkill: "vue.js", jobSkill: "react", credit: 0.6 }]);
  });

  it("upgrades legacy string entries", () => {
    expect(normalizeAdjacentSkills(["typescript"])).toEqual([
      { candidateSkill: "typescript", jobSkill: null, credit: null },
    ]);
  });

  it("returns [] for non-arrays and drops junk entries", () => {
    expect(normalizeAdjacentSkills(null)).toEqual([]);
    expect(normalizeAdjacentSkills([null, 42, {}])).toEqual([]);
  });
});
