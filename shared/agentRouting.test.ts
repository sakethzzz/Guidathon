import { describe, expect, it } from "vitest";
import { inferHandoff } from "./agentRouting";

describe("GUIDATHON specialist routing", () => {
  it("keeps research and judging questions with Hermes", () => {
    expect(inferHandoff("hermes", "What are the judging rules and sources?")).toBe(null);
  });
  it("routes debugging and implementation questions to Hephaestus", () => {
    expect(inferHandoff("hermes", "Can you debug this React state error?")).toBe("hephaestus");
  });
  it("routes user-pain and validation questions to Athena", () => {
    expect(inferHandoff("zeus", "Help validate this idea against user pain")).toBe("athena");
  });
  it("routes milestone and deadline questions to Chronos", () => {
    expect(inferHandoff("athena", "Make a schedule and deadline for the demo")).toBe("chronos");
  });
  it("routes orchestration and ownership questions to Zeus", () => {
    expect(inferHandoff("athena", "Who owns the handoff and context routing?")).toBe("zeus");
  });
  it("routes MCP and database questions to Hephaestus", () => {
    expect(inferHandoff("chronos", "How do I connect an MCP tool to the database?")).toBe("hephaestus");
  });
  it("does not force a specialist handoff for unrelated safe questions", () => {
    expect(inferHandoff("athena", "Tell me a short joke about a sleepy dragon")).toBe(null);
  });
});
