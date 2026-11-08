type McpEnvelope = { result?: Record<string, unknown>; error?: { message?: string } };

function endpoint() {
  const raw = process.env.MCP_SERVER_URL?.trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("MCP_SERVER_URL must use HTTP or HTTPS");
  if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Remote MCP endpoints must use HTTPS");
  }
  return url.toString();
}

async function requestMcp(url: string, body: Record<string, unknown>, sessionId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (process.env.MCP_SERVER_TOKEN) headers.authorization = "Bearer " + process.env.MCP_SERVER_TOKEN;
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
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
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "guidathon", version: "0.4.0" },
    },
  });
  await requestMcp(url, { jsonrpc: "2.0", method: "notifications/initialized" }, initialized.sessionId ?? undefined);
  return initialized.sessionId ?? undefined;
}

export async function listExternalMcpTools() {
  const url = endpoint();
  if (!url) return { configured: false, tools: [] as Array<{ name: string; description?: string; inputSchema?: unknown; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean } }>, reason: "MCP_SERVER_URL is not configured" };
  const sessionId = await initializeMcp(url);
  const result = await requestMcp(url, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, sessionId);
  const tools = Array.isArray(result.payload?.result?.tools) ? result.payload.result.tools as Array<{ name: string; description?: string; inputSchema?: unknown; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean } }> : [];
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
  }, sessionId);
  const output = result.payload?.result ?? {};
  const serialized = JSON.stringify(output);
  if (serialized.length > 24000) return { truncated: true, content: serialized.slice(0, 24000) };
  return output;
}
