import { describe, expect, it } from "vitest";
import { calculateWeightedScore, evaluationRubric } from "./evaluation";

describe("weighted GUIDATHON evaluation", () => {
  it("uses all eight rubric dimensions and totals 100 weight points", () => {
    expect(evaluationRubric).toHaveLength(8);
    expect(evaluationRubric.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });
  it("returns 94 when every criterion averages 9.4/10", () => {
    const criteria = evaluationRubric.map(item => ({ key: item.key, score: 9.4, evidence: "", improvement: "" }));
    expect(calculateWeightedScore(criteria)).toBe(94);
  });
  it("does not allow scores outside the 0–10 range to inflate the result", () => {
    const criteria = evaluationRubric.map(item => ({ key: item.key, score: 100, evidence: "", improvement: "" }));
    expect(calculateWeightedScore(criteria)).toBe(100);
  });
  it("does not award missing criteria points", () => {
    expect(calculateWeightedScore([])).toBe(0);
  });

  it("treats non-finite model scores as zero instead of poisoning the total", () => {
    const criteria = evaluationRubric.map((item, index) => ({
      key: item.key,
      score: index === 0 ? Number.NaN : 9.4,
      evidence: "",
      improvement: "",
    }));
    expect(calculateWeightedScore(criteria)).toBe(80);
  });
});
