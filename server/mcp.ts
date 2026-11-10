type McpEnvelope = { result?: Record<string, unknown>; error?: { message?: string } };

type McpTool = {
  name: string;
  description?: string;
  inputSchema?: unknown;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
};

type McpToolList = {
  configured: boolean;
  tools: McpTool[];
  reason: string | null;
};

const DEFAULT_MCP_ENDPOINT = "https://wikipedia.caseyjhand.com/mcp";
const MCP_PROTOCOL_VERSION = "2025-11-25";

function endpoint() {
  const raw = process.env.MCP_SERVER_URL?.trim() || DEFAULT_MCP_ENDPOINT;
  const url = new URL(raw);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("MCP_SERVER_URL must use HTTP or HTTPS");
  if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Remote MCP endpoints must use HTTPS");
  }
  return url.toString();
}

async function requestMcp(url: string, body: Record<string, unknown>, sessionId?: string, initialized = false) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (initialized) headers["MCP-Protocol-Version"] = MCP_PROTOCOL_VERSION;
  if (process.env.MCP_SERVER_TOKEN) headers.authorization = "Bearer " + process.env.MCP_SERVER_TOKEN;
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(6500) });
  if (!response.ok && response.status !== 202) throw new Error("MCP server returned HTTP " + response.status);
  const nextSession = response.headers.get("mcp-session-id") ?? sessionId;
  const raw = await response.text();
  if (!raw.trim()) return { payload: null as McpEnvelope | null, sessionId: nextSession };
  let payload: McpEnvelope | null = null;
  try { payload = JSON.parse(raw) as McpEnvelope; }
  catch {
    const data = raw.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).filter(Boolean);
    if (data.length) payload = JSON.parse(data[data.length - 1]) as McpEnvelope;
  }
  if (payload?.error) throw new Error(payload.error.message ?? "MCP JSON-RPC error");
  return { payload, sessionId: nextSession };
}

async function initializeMcp(url: string) {
  const initialized = await requestMcp(url, {
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "guidathon", version: "0.4.0" },
    },
  });
  await requestMcp(url, { jsonrpc: "2.0", method: "notifications/initialized" }, initialized.sessionId ?? undefined, true);
  return initialized.sessionId ?? undefined;
}

export async function listExternalMcpTools(): Promise<McpToolList> {
  const url = endpoint();
  if (!url) return { configured: false, tools: [], reason: "MCP_SERVER_URL is not configured" };
  const sessionId = await initializeMcp(url);
  const result = await requestMcp(url, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, sessionId, true);
  const tools = Array.isArray(result.payload?.result?.tools) ? result.payload.result.tools as McpTool[] : [];
  return { configured: true, tools: tools.slice(0, 60).map(tool => ({ name: tool.name, description: tool.description?.slice(0, 500), inputSchema: tool.inputSchema, annotations: tool.annotations })), reason: null };
}

export function mcpToolRequiresConfirmation(annotations?: { readOnlyHint?: boolean }) {
  return annotations?.readOnlyHint !== true;
}

export async function callExternalMcpTool(name: string, args: Record<string, unknown>, confirm = false) {
  const url = endpoint();
  if (!url) throw new Error("MCP_SERVER_URL is not configured");
  const available = await listExternalMcpTools();
  const selectedTool = available.tools.find(tool => tool.name === name);
  if (!selectedTool) throw new Error("Requested tool is not exposed by the configured MCP server");
  // MCP annotations are advisory. Only an explicit readOnlyHint bypasses the
  // confirmation gate; missing or false hints are treated as potentially mutative.
  if (mcpToolRequiresConfirmation(selectedTool.annotations) && !confirm) {
    throw new Error("This MCP tool is not explicitly marked read-only. Confirm the external action before running it.");
  }
  const sessionId = await initializeMcp(url);
  const result = await requestMcp(url, {
    jsonrpc: "2.0", id: 3, method: "tools/call",
    params: { name, arguments: args },
  }, sessionId, true);
  const output = result.payload?.result ?? {};
  const serialized = JSON.stringify(output);
  if (serialized.length > 24000) return { truncated: true, content: serialized.slice(0, 24000) };
  return output;
}


export type WikipediaEvidence = {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: "Wikipedia MCP";
};

function parseToolPayload(payload: Record<string, unknown>) {
  const structured = payload.structuredContent;
  if (structured && typeof structured === "object") return structured as Record<string, unknown>;
  const blocks = Array.isArray(payload.content) ? payload.content as Array<{ type?: string; text?: string }> : [];
  for (const block of blocks) {
    if (typeof block.text !== "string") continue;
    try {
      const parsed = JSON.parse(block.text);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      // Some MCP servers return plain text; leave it unavailable rather than inventing a citation.
    }
  }
  return {};
}

/** Retrieve a small, read-only Wikipedia evidence set through the public MCP server. */
export async function searchWikipediaEvidence(query: string): Promise<WikipediaEvidence[]> {
  const url = endpoint();
  if (!url || !query.trim()) return [];
  const sessionId = await initializeMcp(url);
  const listed = await requestMcp(url, {
    jsonrpc: "2.0", id: 2, method: "tools/list", params: {},
  }, sessionId, true);
  const tools = Array.isArray(listed.payload?.result?.tools)
    ? listed.payload.result.tools as McpTool[]
    : [];
  const searchTool = tools.find(tool => /^wikipedia_search(?:_articles)?$/.test(tool.name));
  if (!searchTool || searchTool.annotations?.readOnlyHint !== true) return [];
  const called = await requestMcp(url, {
    jsonrpc: "2.0", id: 3, method: "tools/call",
    params: {
      name: searchTool.name,
      arguments: { query: query.trim().slice(0, 240), limit: 4, offset: 0, language: "en" },
    },
  }, sessionId, true);
  const result = called.payload?.result;
  if (!result || typeof result !== "object") return [];
  const parsed = parseToolPayload(result as Record<string, unknown>);
  const rows = Array.isArray(parsed.results) ? parsed.results
    : Array.isArray(parsed.articles) ? parsed.articles
    : [];
  return rows.slice(0, 4).flatMap((value, index) => {
    if (!value || typeof value !== "object") return [];
    const row = value as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const snippet = typeof row.snippet === "string" ? row.snippet.trim()
      : typeof row.description === "string" ? row.description.trim()
      : "";
    const pageId = typeof row.pageid === "number" ? row.pageid : typeof row.pageId === "number" ? row.pageId : null;
    const urlValue = typeof row.url === "string" ? row.url
      : typeof row.canonical_url === "string" ? row.canonical_url
      : pageId !== null ? "https://en.wikipedia.org/?curid=" + pageId
      : title ? "https://en.wikipedia.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"))
      : "";
    if (!title || !snippet || !urlValue) return [];
    return [{
      id: "wikipedia-mcp:" + index + ":" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 72),
      title: title.slice(0, 180),
      snippet: snippet.slice(0, 1200),
      url: urlValue,
      source: "Wikipedia MCP" as const,
    }];
  });
}
