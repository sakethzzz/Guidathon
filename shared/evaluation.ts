export const evaluationRubric = [
  { key: "novelty", label: "Novelty & differentiation", weight: 15, question: "Is the mechanism meaningfully different, not just a feature bundle?" },
  { key: "userValue", label: "User pain & value", weight: 15, question: "Is a specific painful user problem clearly solved?" },
  { key: "technical", label: "Technical execution", weight: 15, question: "Is the implementation technically coherent, demonstrated, and honest?" },
  { key: "feasibility", label: "Feasibility & scope", weight: 10, question: "Can the team deliver the promised core loop with its resources and time?" },
  { key: "evidence", label: "Evidence & RAG quality", weight: 15, question: "Are claims grounded in reliable sources with traceable provenance?" },
  { key: "orchestration", label: "Agent orchestration", weight: 10, question: "Do agents have distinct responsibilities, useful routing, and real handoffs?" },
  { key: "experience", label: "UX & accessibility", weight: 10, question: "Is the experience clear, usable, responsive, and accessible?" },
  { key: "reliability", label: "Reliability & safety", weight: 10, question: "Are errors, privacy, permissions, external tools, and deployment considered?" },
] as const;

export type EvaluationCriterionKey = typeof evaluationRubric[number]["key"];
export type EvaluationCriterion = { key: EvaluationCriterionKey; score: number; evidence: string; improvement: string };

export function calculateWeightedScore(criteria: EvaluationCriterion[]) {
  const scoreByKey = new Map(criteria.map(item => [
    item.key,
    Number.isFinite(item.score) ? Math.max(0, Math.min(10, item.score)) : 0,
  ]));
  const totalWeight = evaluationRubric.reduce((sum, item) => sum + item.weight, 0);
  const weighted = evaluationRubric.reduce((sum, item) => sum + (scoreByKey.get(item.key) ?? 0) * item.weight, 0);
  return Math.round((weighted / totalWeight) * 10);
}
