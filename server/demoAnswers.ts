export type DemoAgent = "hermes" | "zeus" | "athena" | "hephaestus" | "chronos";

type DemoEntry = {
  question: string;
  answer: string;
};

const playbook: Record<DemoAgent, DemoEntry[]> = {
  hermes: [
    {
      question: "What is GUIDATHON?",
      answer: "GUIDATHON is an AI-assisted hackathon workspace that helps a team move from a challenge brief to a focused idea, a buildable technical plan, and a submission-ready demo. Its five specialist agents have distinct roles: Hermes handles knowledge and evidence, Zeus coordinates decisions and handoffs, Athena leads product strategy, Hephaestus handles engineering, and Chronos manages execution. In this demo, the prepared answers are available without a live model connection; live research, external tools, and persistent services should only be claimed when their integrations are actually configured.",
    },
    {
      question: "What is RAG and how does Hermes use it?",
      answer: "RAG means retrieval-augmented generation. Instead of relying only on a model's general training, a system retrieves relevant passages from a supplied knowledge collection and gives those passages to the model as context. Hermes is designed to find relevant project sources, distinguish source-backed statements from general guidance, and cite the exact source chunk when available. Retrieval is not the same as fact-checking: a passage can be relevant but still need verification, and Hermes should say when the available sources do not answer a question.",
    },
    {
      question: "What are common hackathon judging criteria?",
      answer: "A useful starting rubric has three broad dimensions: idea quality, implementation quality, and potential impact. For a stronger review, break those into problem relevance, user value, originality, technical execution, usability, demo clarity, feasibility, and evidence of impact. The organizer's published rubric is authoritative; never assume every event uses the same weights. A good submission should show the problem, the working solution, proof that the core flow works, and a clear explanation of what is novel.",
    },
  ],
  zeus: [
    {
      question: "What should our team do first?",
      answer: "Start by making the challenge concrete. In the first 30–60 minutes, write down the target user, the painful problem, the event constraints, the team's skills, and what the judges will reward. Choose one problem statement that can be demonstrated, list the riskiest assumption, and decide how to test it quickly. Do not start by splitting into unrelated features or choosing a tech stack. Once the team agrees on the user and the proof you need, route strategy to Athena, evidence to Hermes, implementation to Hephaestus, and milestones to Chronos.",
    },
    {
      question: "How do the five agents work together?",
      answer: "Hermes gathers and explains evidence. Zeus keeps the shared goal, decisions, and handoffs coherent. Athena challenges the problem and selects a differentiated, testable product direction. Hephaestus turns that direction into an architecture and implementation plan. Chronos sequences the work, owners, checkpoints, and demo buffer. A practical loop is: Hermes frames the evidence → Athena validates the opportunity → Hephaestus defines the smallest working build → Chronos schedules delivery → Zeus checks that the pieces still serve the same goal. A handoff is a recommendation, not proof that another agent or external tool has executed work.",
    },
    {
      question: "How do we know our submission is ready?",
      answer: "Use a binary release check: the core user journey works from a clean start; the deployed URL loads; the README explains setup and environment variables; secrets are not committed; the demo uses a realistic example; errors and empty states are handled; the team can explain the architecture and trade-offs; and the pitch states the user problem, solution, differentiation, and evidence. Test the exact build you will present, keep a short backup recording or screenshots, and stop adding features before the final rehearsal. A green build alone does not prove the live integrations work.",
    },
  ],
  athena: [
    {
      question: "How do we choose a strong hackathon idea?",
      answer: "Choose the idea that solves a specific, painful problem for a reachable user and can be proven in the time available. Compare candidates on five dimensions: problem severity, differentiation, feasibility, demo clarity, and evidence. Give each a 1–5 score, but write one sentence of evidence or uncertainty beside every score so the numbers do not create false precision. Prefer a narrow workflow with a visible before-and-after over a broad platform with many unfinished features. Select the strongest option, define the smallest valuable MVP, and identify the assumption most likely to invalidate it.",
    },
    {
      question: "How can we validate our idea in 48 hours?",
      answer: "Do not try to prove the entire market in two days. First, speak to three to five people who resemble the target user and ask about their current workaround and the last time the problem occurred. Next, sketch or prototype the single riskiest workflow and ask users to complete a realistic task without coaching. Record task completion, confusion points, and whether the solution is meaningfully better than the workaround. Treat this as directional evidence, not statistically representative research. If access to users is impossible, label that limitation and test the workflow with a clearly stated proxy.",
    },
    {
      question: "How should we scale the idea after the MVP?",
      answer: "Scale only after the core workflow shows repeatable value. First instrument activation, task completion, time saved, repeat usage, and failure rate. Then improve reliability and onboarding, validate demand with a wider and more diverse user group, and identify the next bottleneck from observed behavior. Expand one adjacent workflow at a time; avoid adding features just because they are technically interesting. Before scaling infrastructure, establish actual usage and load requirements. A credible roadmap separates what the MVP demonstrates today from what future versions could deliver.",
    },
  ],
  hephaestus: [
    {
      question: "What tech stack should we use for a 48-hour hackathon?",
      answer: "Use the stack the team can debug fastest. A practical default is React with TypeScript for the interface, one familiar backend such as Node/Express or FastAPI, a managed database only if persistence is essential, and a single deployment platform the team already knows. Use external APIs only when they materially improve the core demo, and keep provider keys on the server. Avoid microservices, custom authentication, complex infrastructure, and multiple databases unless the challenge requires them. A boring, reliable vertical slice beats an ambitious stack that cannot be deployed.",
    },
    {
      question: "How should we structure the architecture?",
      answer: "Start with one end-to-end user journey and draw its data flow: interface → API boundary → business logic → storage or external service → response. Keep UI components separate from provider credentials and database access. Define request and response shapes, validate inputs at the API boundary, add timeouts and useful error states for external calls, and log failures without exposing secrets or personal data. Build one vertical slice first, test it, then extract modules when a real boundary appears. Document what is implemented, mocked, and still planned.",
    },
    {
      question: "How do we integrate an API or MCP server safely?",
      answer: "Keep the integration server-side. Store credentials in the hosting provider's encrypted environment settings, validate every input, use HTTPS, set request timeouts, and handle rate limits and provider errors. For MCP, discover and display available tools, validate tool arguments against their schemas, and require explicit confirmation before actions that modify data or trigger external effects. Apply least-privilege credentials, redact tokens from logs, and show a truthful connection state. A configured URL alone does not prove that discovery or a tool call succeeded.",
    },
  ],
  chronos: [
    {
      question: "How should we plan a 48-hour hackathon?",
      answer: "A practical schedule is: hours 0–3, understand the challenge and choose one user problem; hours 3–6, validate the concept and define the MVP; hours 6–10, design the demo flow and architecture; hours 10–28, build the core vertical slice; hours 28–34, integrate and test; hours 34–40, fix critical failures and prepare the pitch; hours 40–44, rehearse and capture a backup demo; hours 44–48, protect the submission buffer and submit early. Adjust for the actual event timetable. Freeze scope before the final third of the event.",
    },
    {
      question: "What must be ready before the final demo?",
      answer: "The final demo needs a stable deployed or locally runnable build, one rehearsed happy path, realistic sample data, working credentials and network access, a clear README, and a backup recording or screenshots. Prepare a 60–90 second explanation of the problem, user, solution, and differentiator, followed by a short live walkthrough. Assign one person to present and another to recover if the demo fails. Stop risky changes before the final rehearsal and submit with a time buffer rather than at the deadline.",
    },
    {
      question: "What should we do if we fall behind schedule?",
      answer: "Freeze new features immediately. List the remaining work as must-have, should-have, and cut. Protect one complete user journey and remove secondary screens, optional integrations, and polish that does not help judges understand the value. Assign one person to stabilize the build while another prepares the pitch and backup demo. Re-estimate using the remaining time, include a testing buffer, and communicate the cut list to the team. A small, reliable product with a clear explanation is stronger than a large collection of broken features.",
    },
  ],
};

export function getDemoQuestions(agent: DemoAgent): string[] {
  return playbook[agent].map(entry => entry.question);
}

export function getDemoAnswer(agent: DemoAgent, question: string): string | null {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const requested = normalize(question);
  const match = playbook[agent].find(entry => normalize(entry.question) === requested);
  return match?.answer ?? null;
}
