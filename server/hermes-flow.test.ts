import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

describe("Hermes first vertical slice", () => {
  const original = {
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    managed: process.env.ALLOW_PAID_MODEL_FALLBACK,
    mcp: process.env.MCP_SERVER_URL,
    token: process.env.MCP_SERVER_TOKEN,
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const [key, value] of Object.entries({
      GEMINI_API_KEY: original.gemini,
      GROQ_API_KEY: original.groq,
      ALLOW_PAID_MODEL_FALLBACK: original.managed,
      MCP_SERVER_URL: original.mcp,
      MCP_SERVER_TOKEN: original.token,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("retrieves live MCP evidence and returns a provenance-aware answer when no LLM key is configured", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    process.env.ALLOW_PAID_MODEL_FALLBACK = "false";
    delete process.env.MCP_SERVER_URL;
    delete process.env.MCP_SERVER_TOKEN;

    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, any>;
      if (body.method === "initialize") {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-11-25" } }), { status: 200 });
      }
      if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
      if (body.method === "tools/list") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0", id: 2,
          result: { tools: [{ name: "wikipedia_search_articles", annotations: { readOnlyHint: true } }] },
        }), { status: 200 });
      }
      if (body.method === "tools/call") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0", id: 3,
          result: { structuredContent: { results: [{
            title: "Retrieval-augmented generation",
            snippet: "Retrieval-augmented generation retrieves external information and supplies it to a language model before generation.",
            pageid: 777,
          }] } },
        }), { status: 200 });
      }
      throw new Error("Unexpected MCP method: " + body.method);
    });
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: null });
    const result = await caller.agents.chat({
      agent: "hermes",
      question: "Explain retrieval-augmented generation",
      context: [],
      history: [],
    });

    expect(result.provider).toBe("local-fallback");
    expect(result.answer).toContain("Retrieval-augmented generation");
    expect(result.answer).toContain("retrieves external information");
    expect(result.citations).toContain("wikipedia-mcp:0:retrieval-augmented-generation");
    expect(result.retrieval).toMatchObject({ localChunks: 0, wikipediaMcpResults: 1 });
    expect(result.retrieval?.sources[0]).toMatchObject({
      source: "Wikipedia MCP",
      url: "https://en.wikipedia.org/?curid=777",
    });
  });
});
