import { describe, expect, it } from "vitest";
import { getDemoAnswer, getDemoQuestions } from "./demoAnswers";

describe("GUIDATHON demo playbook", () => {
  it("provides prepared answers for every specialist", () => {
    const agents = ["hermes", "zeus", "athena", "hephaestus", "chronos"] as const;
    for (const agent of agents) {
      const questions = getDemoQuestions(agent);
      expect(questions).toHaveLength(3);
      expect(getDemoAnswer(agent, questions[0])).toBeTruthy();
    }
  });

  it("matches case and punctuation without guessing on unrelated questions", () => {
    expect(getDemoAnswer("athena", "HOW DO WE CHOOSE A STRONG HACKATHON IDEA?")).toContain("five dimensions");
    expect(getDemoAnswer("hermes", "Tell me a random fact about space")).toBeNull();
  });
});
