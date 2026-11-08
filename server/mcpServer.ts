type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

type AgentId = "zeus" | "hermes" | "athena" | "hephaestus" | "chronos";

const agents: Array<{ id: AgentId; name: string; specialty: string; description: string }> = [
  { id: "zeus", name: "Zeus", specialty: "orchestration", description: "General assistant and coordinator; understands intent and combines specialist work." },
  { id: "hermes", name: "Hermes", specialty: "research and RAG", description: "Research, document understanding, retrieval, citations, and evidence provenance." },
  { id: "athena", name: "Athena", specialty: "reasoning and judging", description: "Critical thinking, idea validation, trade-offs, judging, and constructive feedback." },
  { id: "hephaestus", name: "Hephaestus", specialty: "engineering and integrations", description: "Coding, debugging, architecture, implementation, and MCP tool workflows." },
  { id: "chronos", name: "Chronos", specialty: "planning and delivery", description: "Timelines, milestones, prioritization, task ownership, and submission readiness." },
];

const tools = [
  {
    name: "guidathon.list_agents",
    description: "List the five GUIDATHON agents, their specialties, and what each can help with.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "guidathon.build_hackathon_plan",
    description: "Create a practical milestone plan from a challenge and available hackathon hours. Returns relative hour offsets, not calendar events.",
    inputSchema: {
      type: "object",
      properties: {
        challenge: { type: "string", minLength: 5, maxLength: 2000 },
        durationHours: { type: "number", minimum: 4, maximum: 336, default: 48 },
        teamSize: { type: "number", minimum: 1, maximum: 20, default: 3 },
      },
      required: ["challenge"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "guidathon.judge_readiness_checklist",
    description: "Build a transparent judge-readiness checklist from supplied project, evidence, and implementation notes. Does not claim to be a judge score.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", minLength: 1, maxLength: 4000 },
        evidence: { type: "string", maxLength: 4000 },
        implementation: { type: "string", maxLength: 4000 },
      },
      required: ["project"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "guidathon.get_platform_status",
    description: "Report which GUIDATHON server capabilities are configured without exposing credentials.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
] as const;

function textResult(value: unknown) {
  const text = JSON.stringify(value, null, 2);
  return { content: [{ type: "text", text }], structuredContent: value, isError: false };
}

function buildPlan(challenge: string, durationHours: number, teamSize: number) {
  const milestones = [
    { name: "Frame the problem and rules", owner: "Hermes + Zeus", start: 0, end: Math.round(durationHours * 0.1), outcome: "One target user, challenge constraints, and a clear success signal" },
    { name: "Validate the idea", owner: "Athena", start: Math.round(durationHours * 0.1), end: Math.round(durationHours * 0.22), outcome: "A testable hypothesis and a deliberately small scope" },
    { name: "Build the core experience", owner: "Hephaestus", start: Math.round(durationHours * 0.22), end: Math.round(durationHours * 0.72), outcome: "A working happy path with real data and visible failure states" },
    { name: "Test and improve", owner: "Whole team", start: Math.round(durationHours * 0.72), end: Math.round(durationHours * 0.86), outcome: "At least three focused checks and the highest-impact fixes" },
    { name: "Prepare and submit", owner: "Chronos + Zeus", start: Math.round(durationHours * 0.86), end: durationHours, outcome: "Demo recording, README, submission form, and final buffer" },
  ];
  return {
    challenge,
    durationHours,
    teamSize,
    planningNote: "Offsets are relative to the start of your event. Confirm the organizer's actual deadline and adjust owners to your team.",
    milestones,
    guardrails: ["Freeze scope before the build midpoint.", "Keep one end-to-end demo path working throughout.", "Reserve at least 14% of the event for testing and submission.", "Every task needs one owner and an observable done condition."],
  };
}

function readinessChecklist(project: string, evidence: string, implementation: string) {
  return {
    project,
    label: "Readiness checklist — not a judge score",
    checks: [
      { area: "Problem and user", ready: project.length >= 120, next: "Name one specific user, their painful moment, and the measurable improvement." },
      { area: "Evidence", ready: evidence.trim().length >= 80, next: "Attach primary sources, user observations, or test results for important claims." },
      { area: "Working implementation", ready: implementation.trim().length >= 120, next: "Show a reproducible happy path, real inputs and outputs, and tested failure states." },
      { area: "Demo and submission", ready: false, next: "Prepare a short demo, setup instructions, screenshots, and the final submission form." },
    ],
    caveat: "A text checklist cannot verify the running application, user outcomes, or source authenticity.",
  };
}

function platformStatus() {
  return {
    service: "GUIDATHON MCP server",
    builtInMcpServer: true,
    agents: 5,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    managedModelConfigured: Boolean(process.env.MANUS_API_URL && process.env.MANUS_API_KEY),
    persistentDatabaseConfigured: Boolean(process.env.DATABASE_URL),
    externalMcpConfigured: Boolean(process.env.MCP_SERVER_URL),
  };
}

export function handleMcpRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid JSON-RPC request" } };
  }
  const request = body as JsonRpcRequest;
  const id = request.id ?? null;
  if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid JSON-RPC request" } };
  }
  if (request.method.startsWith("notifications/")) return null;

  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "guidathon", version: "1.0.0" },
        instructions: "GUIDATHON provides read-only hackathon planning and agent discovery tools. All five agents can answer general questions; each has a specialist strength.",
      },
    };
  }
  if (request.method === "ping") return { jsonrpc: "2.0", id, result: {} };
  if (request.method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools } };
  }
  if (request.method === "tools/call") {
    const params = request.params ?? {};
    const name = typeof params.name === "string" ? params.name : "";
    const args = params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments)
      ? params.arguments as Record<string, unknown>
      : {};
    let result: unknown;
    if (name === "guidathon.list_agents") {
      result = { agents };
    } else if (name === "guidathon.build_hackathon_plan") {
      const challenge = typeof args.challenge === "string" ? args.challenge.trim() : "";
      const durationHours = Number(args.durationHours ?? 48);
      const teamSize = Number(args.teamSize ?? 3);
      if (challenge.length < 5 || challenge.length > 2000 || !Number.isFinite(durationHours) || durationHours < 4 || durationHours > 336 || !Number.isFinite(teamSize) || teamSize < 1 || teamSize > 20) {
        return { jsonrpc: "2.0", id, error: { code: -32602, message: "Provide a challenge (5–2000 chars), durationHours (4–336), and teamSize (1–20)." } };
      }
      result = buildPlan(challenge, durationHours, teamSize);
    } else if (name === "guidathon.judge_readiness_checklist") {
      const project = typeof args.project === "string" ? args.project.trim() : "";
      if (!project) return { jsonrpc: "2.0", id, error: { code: -32602, message: "The project field is required." } };
      result = readinessChecklist(project, typeof args.evidence === "string" ? args.evidence : "", typeof args.implementation === "string" ? args.implementation : "");
    } else if (name === "guidathon.get_platform_status") {
      result = platformStatus();
    } else {
      return { jsonrpc: "2.0", id, error: { code: -32602, message: "Unknown tool: " + name } };
    }
    return { jsonrpc: "2.0", id, result: textResult(result) };
  }
  return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found: " + request.method } };
}
