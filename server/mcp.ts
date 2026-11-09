type McpEnvelope = { result?: Record<string, unknown>; error?: { message?: string } };
type McpTool = {
  name: string; description?: string; inputSchema?: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
  serverName?: string;
};
type McpServerConfig = { name: string; url: string; tokenEnv?: string; enabled?: boolean };
type McpToolList = { configured: boolean; tools: McpTool[]; reason: string | null };
type McpConnection = { config: McpServerConfig; sessionId?: string };

function configuredServers(): McpServerConfig[] {
  const raw = process.env.MCP_SERVERS_JSON?.trim();
  let servers: McpServerConfig[] = [];
  if (raw) {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("MCP_SERVERS_JSON must be a JSON array");
    servers = parsed as McpServerConfig[];
  } else if (process.env.MCP_SERVER_URL?.trim()) {
    servers = [{ name: "default", url: process.env.MCP_SERVER_URL.trim(), tokenEnv: "MCP_SERVER_TOKEN" }];
  }
  return servers.filter(server => server.enabled !== false).map(server => {
    if (!/^[a-z0-9][a-z0-9_-]{0,39}$/i.test(server.name)) throw new Error("Invalid MCP server name");
    const url = new URL(server.url);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      throw new Error("MCP endpoints must use HTTPS (HTTP is allowed only for localhost)");
    }
    if (url.username || url.password) throw new Error("Credentials must not be embedded in MCP endpoint URLs");
    return { ...server, url: url.toString() };
  });
}

async function requestMcp(connection: McpConnection, body: Record<string, unknown>) {
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json, text/event-stream" };
  const token = connection.config.tokenEnv ? process.env[connection.config.tokenEnv] : undefined;
  if (token) headers.authorization = "Bearer " + token;
  if (connection.sessionId) headers["mcp-session-id"] = connection.sessionId;
  const response = await fetch(connection.config.url, {
    method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
  });
  if (!response.ok && response.status !== 202) throw new Error("MCP server returned HTTP " + response.status);
  connection.sessionId = response.headers.get("mcp-session-id") ?? connection.sessionId;
  const raw = await response.text();
  if (!raw.trim()) return null;
  let payload: McpEnvelope | null = null;
  try { payload = JSON.parse(raw) as McpEnvelope; }
  catch {
    const data = raw.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).filter(Boolean);
    if (data.length) payload = JSON.parse(data[data.length - 1]) as McpEnvelope;
  }
  if (payload?.error) throw new Error(payload.error.message ?? "MCP JSON-RPC error");
  return payload;
}

async function connectMcp(config: McpServerConfig): Promise<McpConnection> {
  const connection: McpConnection = { config };
  await requestMcp(connection, {
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "guidathon-mcp-mesh", version: "1.0.0" } },
  });
  await requestMcp(connection, { jsonrpc: "2.0", method: "notifications/initialized" });
  return connection;
}

export function mcpToolRequiresConfirmation(annotations?: { readOnlyHint?: boolean }) {
  return annotations?.readOnlyHint !== true;
}

async function discoverServerTools(config: McpServerConfig): Promise<McpTool[]> {
  const connection = await connectMcp(config);
  const response = await requestMcp(connection, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const tools = Array.isArray(response?.result?.tools) ? response.result.tools as McpTool[] : [];
  return tools.slice(0, 60).map(tool => ({ ...tool, serverName: config.name }));
}

export async function listExternalMcpTools(): Promise<McpToolList> {
  const servers = configuredServers();
  if (!servers.length) return { configured: false, tools: [], reason: "No MCP servers configured. Set MCP_SERVERS_JSON to connect one or more remote servers." };
  const settled = await Promise.allSettled(servers.map(discoverServerTools));
  const tools = settled.flatMap(result => result.status === "fulfilled" ? result.value : []);
  const failures = settled.flatMap((result, index) => result.status === "rejected" ? [servers[index].name + ": " + (result.reason instanceof Error ? result.reason.message : "connection failed")] : []);
  return { configured: true, tools: tools.map(tool => ({ ...tool, name: tool.serverName + "__" + tool.name })), reason: failures.length ? failures.join("; ") : null };
}

function toolArguments(tool: McpTool, question: string): Record<string, unknown> | null {
  const schema = tool.inputSchema ?? {};
  const properties = schema.properties && typeof schema.properties === "object" ? schema.properties as Record<string, unknown> : {};
  const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === "string") : [];
  const args: Record<string, unknown> = {};
  for (const key of Object.keys(properties)) {
    const normalized = key.toLowerCase();
    if (["query", "q", "search", "search_query", "term", "question", "text"].includes(normalized)) args[key] = question;
    else if (["limit", "count", "max_results", "num_results"].includes(normalized)) args[key] = 3;
  }
  if (required.some(key => !(key in args))) return null;
  return args;
}

export async function callExternalMcpTool(name: string, args: Record<string, unknown>, confirm = false) {
  const separator = name.indexOf("__");
  if (separator < 1) throw new Error("MCP tool names must include their server namespace");
  const serverName = name.slice(0, separator), toolName = name.slice(separator + 2);
  const config = configuredServers().find(server => server.name === serverName);
  if (!config) throw new Error("MCP server is not configured");
  const tools = await discoverServerTools(config);
  const selectedTool = tools.find(tool => tool.name === toolName);
  if (!selectedTool) throw new Error("Requested tool is not exposed by the configured MCP server");
  if (mcpToolRequiresConfirmation(selectedTool.annotations) && !confirm) {
    throw new Error("This MCP tool is not explicitly marked read-only. GUIDATHON is configured for read-only access.");
  }
  if (confirm) throw new Error("Write-capable MCP calls are disabled by GUIDATHON's read-only policy.");
  const connection = await connectMcp(config);
  const response = await requestMcp(connection, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: toolName, arguments: args } });
  const output = response?.result ?? {};
  const serialized = JSON.stringify(output);
  if (serialized.length > 16000) return { truncated: true, content: serialized.slice(0, 16000) };
  return output;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

export async function searchPublicKnowledge(question: string): Promise<{ text: string; citations: string[] }> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({ action: "query", list: "search", srsearch: question, srlimit: "3", format: "json", origin: "*" }).toString();
  try {
    const response = await fetch(url, { headers: { "user-agent": "GUIDATHON/1.0 (research assistant)" }, signal: AbortSignal.timeout(7000) });
    if (!response.ok) return { text: "", citations: [] };
    const data = await response.json() as { query?: { search?: Array<{ title: string; snippet: string }> } };
    const results = data.query?.search ?? [];
    return {
      text: results.map(item => "Wikipedia: " + item.title + "\n" + stripHtml(item.snippet)).join("\n\n").slice(0, 7000),
      citations: results.map(item => "https://en.wikipedia.org/wiki/" + encodeURIComponent(item.title.replace(/ /g, "_"))),
    };
  } catch { return { text: "", citations: [] }; }
}

export async function buildAgentResearchContext(question: string): Promise<{ text: string; citations: string[]; toolsUsed: string[] }> {
  const wiki = await searchPublicKnowledge(question);
  let externalText = "";
  const toolsUsed: string[] = [];
  try {
    const discovered = await listExternalMcpTools();
    const words = question.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 3);
    const candidates = discovered.tools
      .filter(tool => tool.annotations?.readOnlyHint === true)
      .map(tool => {
        const description = (tool.name + " " + (tool.description ?? "")).toLowerCase();
        const score = words.reduce((total, word) => total + (description.includes(word) ? 1 : 0), 0);
        return { tool, score };
      }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score).slice(0, 2);
    const results = await Promise.allSettled(candidates.map(async ({ tool }) => {
      const args = toolArguments(tool, question);
      if (!args) return null;
      const result = await callExternalMcpTool(tool.name, args);
      return { name: tool.name, result };
    }));
    for (const result of results) if (result.status === "fulfilled" && result.value) {
      externalText += "\n\nMCP " + result.value.name + ":\n" + JSON.stringify(result.value.result).slice(0, 5000);
      toolsUsed.push(result.value.name);
    }
  } catch { /* Built-in Wikipedia research remains available when remote MCP is offline. */ }
  return { text: [wiki.text, externalText].filter(Boolean).join("\n\n").slice(0, 10000), citations: wiki.citations, toolsUsed };
}
