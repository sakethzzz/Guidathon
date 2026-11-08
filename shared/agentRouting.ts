export type AgentId = "hermes" | "zeus" | "athena" | "hephaestus" | "chronos";
const agentIds: AgentId[] = ["hermes", "zeus", "athena", "hephaestus", "chronos"];
const agentNames: Record<AgentId, string> = { hermes: "Hermes", zeus: "Zeus", athena: "Athena", hephaestus: "Hephaestus", chronos: "Chronos" };
const agentResponsibilities: Record<AgentId, string> = {
  hermes: "research, source intake, evidence retrieval, citations, and hackathon rules",
  zeus: "orchestration, routing, ownership, shared context, and agent handoffs",
  athena: "idea validation, user pain, differentiation, hypotheses, and proof experiments",
  hephaestus: "code, debugging, architecture, databases, APIs, deployment, and integrations",
  chronos: "deadlines, timelines, milestones, task ownership, and submission readiness",
};
const routingSignals: Record<AgentId, RegExp> = {
  hermes: /\\b(source|citation|cite|research|evidence|judging rubric|event rules|hackathon rules|reference)\\b/i,
  zeus: /\\b(orchestrat|handoff|route|routing|coordinate|ownership|which agent|who should handle|context flow)\\b/i,
  athena: /\\b(idea validation|validate (the )?idea|user pain|hypothesis|differentiat|novelty|market fit|brainstorm|product direction)\\b/i,
  hephaestus: /\\b(code|debug|bug|stack|architecture|database|sql|api|mcp|integration|deploy|deployment|implementation|vector database)\\b/i,
  chronos: /\\b(deadline|timeline|milestone|schedule|task list|due date|time left|submission|time management|sprint plan)\\b/i,
};
export function inferHandoff(current: AgentId, question: string): AgentId | null {
  return agentIds.find(id => id !== current && routingSignals[id].test(question)) ?? null;
}
export function handoffAnswer(target: AgentId) {
  return "This is best handled by " + agentNames[target] + ", whose domain is " + agentResponsibilities[target] + ". I will not guess outside my specialty. Open " + agentNames[target] + "'s room and carry this question forward; your current context stays with the workspace.";
}

