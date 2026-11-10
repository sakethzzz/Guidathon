import { afterEach, describe, expect, it, vi } from "vitest";
import { searchWikipediaEvidence } from "./mcp";

describe("Hermes Wikipedia MCP retrieval", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MCP_SERVER_URL;
    delete process.env.MCP_SERVER_TOKEN;
  });

  it("discovers the read-only search tool and returns source-backed results without an API key", async () => {
    const requests: Array<{ body: Record<string, any>; headers: Headers }> = [];
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, any>;
      requests.push({ body, headers });
      if (body.method === "initialize") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0", id: body.id,
          result: { protocolVersion: "2025-11-25", capabilities: {}, serverInfo: { name: "wikipedia-mcp-server", version: "0.3.0" } },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
      if (body.method === "tools/list") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0", id: body.id,
          result: { tools: [{ name: "wikipedia_search_articles", annotations: { readOnlyHint: true }, inputSchema: { type: "object" } }] },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (body.method === "tools/call") {
        expect(body.params.name).toBe("wikipedia_search_articles");
        expect(body.params.arguments).toMatchObject({ query: "retrieval augmented generation", limit: 4, language: "en" });
        return new Response(JSON.stringify({
          jsonrpc: "2.0", id: body.id,
          result: { structuredContent: { results: [{
            title: "Retrieval-augmented generation",
            snippet: "Retrieval-augmented generation combines retrieval with text generation.",
            pageid: 123,
          }] } },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      throw new Error("Unexpected MCP request: " + body.method);
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchWikipediaEvidence("retrieval augmented generation");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "Retrieval-augmented generation",
      source: "Wikipedia MCP",
      url: "https://en.wikipedia.org/?curid=123",
    });
    expect(requests[2].headers.get("MCP-Protocol-Version")).toBe("2025-11-25");
    expect(requests[3].headers.get("MCP-Protocol-Version")).toBe("2025-11-25");
  });

  it("does not execute a search tool that is not explicitly marked read-only", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, any>;
      if (body.method === "initialize") {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-11-25" } }), { status: 200 });
      }
      if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
      if (body.method === "tools/list") {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: 2, result: { tools: [{ name: "wikipedia_search", annotations: { readOnlyHint: false } }] } }), { status: 200 });
      }
      throw new Error("Mutative/unknown MCP tool must not run");
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await searchWikipediaEvidence("test query")).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
