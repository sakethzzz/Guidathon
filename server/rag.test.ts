import { describe, expect, it } from "vitest";
import { cosine, lexicalScore } from "./rag";

describe("GUIDATHON retrieval scoring", () => {
  it("ranks identical embedding vectors at cosine similarity 1", () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("returns zero for orthogonal, empty, zero-magnitude, or mismatched vectors", () => {
    expect(cosine([1, 0], [0, 1])).toBe(0);
    expect(cosine([], [])).toBe(0);
    expect(cosine([0, 0], [1, 1])).toBe(0);
    expect(cosine([1, 2], [1])).toBe(0);
  });

  it("uses case-insensitive lexical overlap when vectors are unavailable", () => {
    expect(lexicalScore("Hackathon judging rules", "The HACKATHON has judging rules.")).toBe(1);
  });

  it("normalizes lexical matches by the number of meaningful query terms", () => {
    expect(lexicalScore("hackathon judging deadline", "The hackathon has a deadline.")).toBeCloseTo(2 / 3);
  });

  it("does not award a match for an empty or punctuation-only query", () => {
    expect(lexicalScore("", "some source text")).toBe(0);
    expect(lexicalScore("!!! ...", "some source text")).toBe(0);
  });
});
