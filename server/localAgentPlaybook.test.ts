import { describe, expect, it } from "vitest";
import { localAgentReply } from "./localAgentPlaybook";

describe("local agent review playbook", () => {
  it("answers common hackathon questions without a hosted model", () => {
    expect(localAgentReply("hermes", "What is an MVP?").answer).toMatch(/smallest complete version/i);
    expect(localAgentReply("athena", "How do I validate my idea?").answer).toMatch(/Validate the idea/i);
    expect(localAgentReply("hephaestus", "What is MCP?").answer).toMatch(/Model Context Protocol/i);
  });
  it("keeps Athena strategic and Chronos time-focused", () => {
    expect(localAgentReply("athena", "Suggest something").answer).toMatch(/user backwards/i);
    expect(localAgentReply("chronos", "Suggest something").answer).toMatch(/three checkpoints/i);
  });
  it("clearly identifies itself as a local review fallback", () => {
    expect(localAgentReply("zeus", "Hello").provider).toBe("local-review-playbook");
    expect(localAgentReply("zeus", "Hello").mode).toBe("review-fallback");
  });
});
