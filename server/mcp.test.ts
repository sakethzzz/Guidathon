import { describe, expect, it } from "vitest";
import { mcpToolRequiresConfirmation } from "./mcp";

describe("GUIDATHON MCP read-only policy", () => {
  it("allows only tools explicitly marked read-only", () => {
    expect(mcpToolRequiresConfirmation({ readOnlyHint: true })).toBe(false);
  });
  it("blocks write-capable or unclassified tools by default", () => {
    expect(mcpToolRequiresConfirmation({ readOnlyHint: false })).toBe(true);
    expect(mcpToolRequiresConfirmation(undefined)).toBe(true);
    expect(mcpToolRequiresConfirmation({})).toBe(true);
  });
});
