import { describe, expect, it } from "vitest";
import { agentConversationStorageKey, normalizeAgentMessages, serializeBoundedJson, workspaceStorageKey } from "./workspace";

describe("durable workspace boundaries", () => {
  it("uses owner-specific keys for snapshots and per-agent transcripts", () => {
    expect(workspaceStorageKey("owner-a")).not.toBe(workspaceStorageKey("owner-b"));
    expect(agentConversationStorageKey("owner-a", "hermes")).not.toBe(agentConversationStorageKey("owner-b", "hermes"));
    expect(agentConversationStorageKey("owner-a", "hermes")).not.toBe(agentConversationStorageKey("owner-a", "athena"));
  });

  it("rejects oversized JSON before writing it to MySQL", () => {
    expect(serializeBoundedJson({ ok: true }, 100, "test")).toBe('{"ok":true}');
    expect(() => serializeBoundedJson({ payload: "x".repeat(100) }, 32, "test")).toThrow(/safety limit/);
  });

  it("drops malformed messages and keeps only the latest 100 valid turns", () => {
    const messages = Array.from({ length: 105 }, (_, index) => ({ role: "user" as const, text: "turn-" + index, createdAt: "2026-11-08T00:00:00.000Z" }));
    messages.push({ role: "system" as "user", text: "not valid", createdAt: "now" });
    const normalized = normalizeAgentMessages(messages);
    expect(normalized).toHaveLength(100);
    expect(normalized[0].text).toBe("turn-5");
    expect(normalized.at(-1)?.text).toBe("turn-104");
  });
});
