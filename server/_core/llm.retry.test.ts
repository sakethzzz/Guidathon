import { describe, expect, it } from "vitest";
import { isRetryableStatus } from "./llm";

describe("LLM upstream retry policy", () => {
  it("retries transient throttling and server failures", () => {
    for (const status of [408, 425, 429, 500, 502, 503, 504]) {
      expect(isRetryableStatus(status)).toBe(true);
    }
  });

  it("does not retry permanent client errors", () => {
    for (const status of [400, 401, 403, 404, 409, 422]) {
      expect(isRetryableStatus(status)).toBe(false);
    }
  });

  it("does not retry successful responses", () => {
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(204)).toBe(false);
  });
});
