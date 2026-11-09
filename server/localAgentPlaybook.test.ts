import { describe, expect, it } from "vitest";
import { localAgentReply } from "./localAgentPlaybook";

describe("local agent review playbook", () => {
  it("answers common hackathon questions without a hosted model", () => {
    expect(localAgentReply("hermes", "What is an MVP?").answer).toMatch(/smallest complete version/i);
    expect(localAgentReply("athena", "How do I validate my idea?").answer).toMatch(/Validate the idea/i);
    expect(localAgentReply("hephaestus", "What is MCP?").answer).toMatch(/Model Context Protocol/i);
  });
  it("explains MCP directly when Hermes is asked in plain language", () => {\n    const answer = localAgentReply("hermes", "Explain MCP simply").answer;\n    expect(answer).toMatch(/Model Context Protocol/i);\n    expect(answer).toMatch(/external tools and data/i);\n    expect(answer).not.toMatch(/review mode/i);\n  });\n  it("keeps Athena strategic and Chronos time-focused", () => {
    expect(localAgentReply("athena", "Suggest something").answer).toMatch(/user backwards/i);
    expect(localAgentReply("chronos", "Suggest something").answer).toMatch(/three checkpoints/i);
  });
  it("gives Athena strategy recommendations and Chronos a schedule", () => {
    expect(localAgentReply("athena", "Suggest three ways to improve a student hackathon project.").answer).toMatch(/three high-impact ways/i);
    expect(localAgentReply("chronos", "Give me a simple 3-step plan to finish a hackathon project.").answer).toMatch(/3-step finish plan/i);
  });
  it("clearly identifies itself as a local review fallback", () => {
    expect(localAgentReply("zeus", "Hello").provider).toBe("local-review-playbook");
    expect(localAgentReply("zeus", "Hello").mode).toBe("review-fallback");
  });
});
