import { describe, expect, it } from "vitest";
import { mcpToolRequiresConfirmation } from "./mcp";

describe("MCP external action confirmation", () => {
  it("allows bypass only when the server explicitly marks a tool read-only", () => {
    expect(mcpToolRequiresConfirmation({ readOnlyHint: true })).toBe(false);
  });

  it("requires confirmation when read-only is false or missing", () => {
    expect(mcpToolRequiresConfirmation({ readOnlyHint: false })).toBe(true);
    expect(mcpToolRequiresConfirmation(undefined)).toBe(true);
    expect(mcpToolRequiresConfirmation({})).toBe(true);
  });
});
