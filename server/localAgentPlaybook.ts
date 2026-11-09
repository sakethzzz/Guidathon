export type ReviewAgentId = "hermes" | "zeus" | "athena" | "hephaestus" | "chronos";

const names: Record<ReviewAgentId, string> = {
  hermes: "Hermes",
  zeus: "Zeus",
  athena: "Athena",
  hephaestus: "Hephaestus",
  chronos: "Chronos",
};

const has = (text: string, pattern: RegExp) => pattern.test(text);

const commonAnswers = {
  guidathon: "GUIDATHON is a multi-agent hackathon companion. Hermes handles research and evidence, Athena leads product strategy, Hephaestus handles technical execution, Chronos manages milestones and submissions, and Zeus coordinates the team. The goal is to turn a challenge brief into a validated idea, a buildable MVP, and a clear final submission.",
  hackathon: "Start by extracting the problem, target user, constraints, judging criteria, and deadline from the challenge brief. Pick one painful user problem, validate it quickly, define a small end-to-end MVP, and build the demo path before adding extra features. Keep evidence and a pitch narrative alongside the build.",
  mvp: "An MVP is the smallest complete version that proves the core user value. Keep one target user, one painful problem, and one primary workflow. Cut secondary dashboards, complex automation, and decorative features until that workflow works end to end. Define a test that would show whether the MVP actually helps.",
  pitch: "A strong hackathon pitch follows this sequence: the problem and who feels it; why current options fall short; your solution and its key differentiator; a short live demo of the core workflow; evidence or test results; and what you would build next. Lead with the user outcome, not the technology list.",
  judging: "Judges typically look for problem clarity, user value, originality, technical execution, feasibility, evidence, usability, and a convincing demo. Treat the published event rubric as authoritative. Make every important claim easy to verify and show the working product rather than relying on slides alone.",
  validate: "Validate the idea before expanding the build: state the user and pain clearly, speak to or observe a few representative users if possible, compare existing alternatives, and test the riskiest assumption with a tiny prototype. Record what you observed and define a measurable pass/fail signal.",
  stack: "Choose the simplest stack your team can build and debug confidently. Decide the frontend, backend/API, persistence, model/provider, and deployment path; then test one complete vertical slice early. Avoid adding services or MCP integrations unless a real workflow needs them.",
  mcp: "MCP (Model Context Protocol) is a standard way for AI applications to connect to external tools and data. An MCP server makes tools available through a common interface; the AI application can then call those tools when useful. Think of it as a universal adapter between an AI app and services such as files, databases, or APIs. MCP provides tool connectivity, not the AI model itself, so an agent still needs a working model to understand questions and produce answers.",
  demo: "Make the demo reliable before making it ambitious. Prepare a known-good account and dataset, rehearse the exact click path, show one complete user journey, and keep a short fallback recording or screenshots. Avoid depending on unverified APIs or live integrations during the final presentation.",
};

export function localAgentReply(agent: ReviewAgentId, question: string, context = "") {
  const q = question.toLowerCase();
  let answer = "";

  if (has(q, /\b(hi|hello|hey|good morning|good afternoon)\b/)) {
    answer = `Hello! I'm ${names[agent]}. ${agent === "athena" ? "I can help shape the idea, test its value, and choose what to build next." : agent === "hermes" ? "I can help research the challenge, explain concepts, and organize evidence." : agent === "hephaestus" ? "I can help with architecture, code, debugging, and integrations." : agent === "chronos" ? "I can turn the goal into milestones and a realistic schedule." : "I can coordinate the specialists and keep the project moving."} What are you working on?`;
  } else if (has(q, /what is guidathon|about guidathon|what does guidathon do/)) {
    answer = commonAnswers.guidathon;
  } else if (has(q, /what is an mvp|minimum viable product|define mvp/)) {
    answer = commonAnswers.mvp;
  } else if (has(q, /\b(mcp)\b|model context protocol/)) {
    answer = commonAnswers.mcp;
  } else if (agent === "athena" && has(q, /suggest|three ways|improve|ideas|brainstorm|better|innovate|differentiat/)) {
    answer = "Here are three high-impact ways to improve the project:\n\n1. **Narrow the user problem:** choose one clearly defined user group and one painful task. Make the before/after outcome obvious.\n\n2. **Prove one differentiator:** identify what existing alternatives fail to do, then demonstrate one feature that closes that gap. Avoid adding features that do not strengthen this advantage.\n\n3. **Make the demo evidence-led:** show the complete user journey, measure one outcome (time saved, errors reduced, or task completion), and include a real test or user observation.\n\n**My recommendation:** prioritize the smallest end-to-end workflow that proves a meaningful user benefit. Share the challenge statement and I can tailor these three improvements.";
  } else if (agent === "chronos" && has(q, /plan|schedule|steps|finish|deadline|time|timeline|milestone/)) {
    answer = "Here is a practical 3-step finish plan:\n\n1. **Scope and lock (first 20%):** confirm the challenge, target user, judging criteria, and one MVP workflow. Freeze new feature requests.\n\n2. **Build and verify (middle 60%):** complete the main workflow end to end, test the happy path and one failure case, and fix blockers before polishing.\n\n3. **Submit and rehearse (final 20%):** verify submission fields, prepare screenshots/video, rehearse a 3–5 minute pitch, and keep a buffer for deployment issues.\n\n**Done means:** the core flow works on the demo device, the submission is complete, and the pitch has been rehearsed.";
  } else if (has(q, /pitch|present|presentation|demo script/)) {
    answer = commonAnswers.pitch;
  } else if (has(q, /judge|judging|evaluation|rubric|score/)) {
    answer = commonAnswers.judging;
  } else if (has(q, /validate|validation|user research|market fit|user pain/)) {
    answer = commonAnswers.validate;
  } else if (has(q, /tech stack|which stack|technology stack|architecture/)) {
    answer = commonAnswers.stack;
  } else if (has(q, /demo|showcase/)) {
    answer = commonAnswers.demo;
  } else if (has(q, /hackathon|where do i start|how should i start|start a project/)) {
    answer = commonAnswers.hackathon;
  } else if (agent === "athena") {
    answer = "Let's make this decision from the user backwards. First, name the exact user and the frustrating task they need to complete. Next, identify what existing alternatives fail to do. Then test one differentiated solution with a small prototype. My recommendation is to prioritize one measurable user outcome over adding more features. Share the challenge statement or idea and I can help narrow it down.";
  } else if (agent === "hermes") {
    answer = "I can help explain concepts and organize reliable information. Tell me the specific term or question and I'll answer it directly, then separate established facts from assumptions. For research claims, I'll only cite sources that are actually available rather than inventing references.";
  } else if (agent === "hephaestus") {
    answer = "For a reliable implementation, build and test one vertical slice first: user action → frontend state → API request → server validation → persistence or model call → visible result. Then add error handling, loading states, and deployment checks. Keep secrets server-side and verify every external integration independently. Share the error or stack and I can narrow the diagnosis.";
  } else if (agent === "chronos") {
    answer = "Use three checkpoints: (1) define the problem and freeze the MVP; (2) complete the core workflow and test it; (3) rehearse the demo, verify the submission requirements, and prepare the pitch. Reserve the final 15–20% of available time for integration, bug fixes, and presentation. Tell me the deadline and team size for a more precise schedule.";
  } else {
    answer = "I'll coordinate this around a clear outcome. Identify the decision to make, the information needed, and the next owner: Hermes for evidence, Athena for product direction, Hephaestus for implementation, and Chronos for deadlines. For now, make the smallest next decision and keep the team aligned on one shared MVP.";
  }

  return {
    answer,
    provider: "local-review-playbook",
    citations: [] as string[],
    handoffTo: null,
    mode: "review-fallback" as const,
  };
}
