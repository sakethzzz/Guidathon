# GUIDATHON

GUIDATHON is an interactive mentorship workspace for hackathon teams. It turns a vague challenge into an evidence-backed idea, a buildable technical plan, and a dated submission path. The experience is organized as a guided constellation of five bounded spirits instead of a static dashboard of disconnected agent cards.

## Product flow

The first room is Hermes. Hermes accepts natural-language questions, challenge briefs, pasted notes, and common text/source-code files. Text sources are locally chunked and marked unverified until the intake pipeline promotes them. Only verified chunks enter retrieval. When a user asks a question, the browser ranks matching chunks and sends the question, recent conversation, and retrieved evidence to the server-side `hermes.ask` procedure. The managed LLM returns a concise answer with inline chunk IDs when the evidence supports a claim. If the server model is unavailable, the UI returns a clearly labeled local-evidence fallback instead of pretending a model ran.

After onboarding, the handoff moves through the five spirits:

- **Hermes** frames the question, answers hackathon knowledge requests, and exposes evidence.
- **Zeus** orchestrates context and chooses the next owner of a decision.
- **Athena** pressure-tests ideas against user pain, proof, and scope.
- **Hephaestus** proposes the smallest practical stack, workflow, and integration boundary.
- **Chronos** converts the plan into owners, milestones, deadlines, and submission readiness.

Each spirit has a dedicated role chat in the Constellations room. The role chats are deliberately scoped: Zeus talks about routing, Athena about decisions, Hephaestus about implementation, and Chronos about time. Responses vary by the question’s intent instead of returning one generic sentence.

## Constellations room

The Constellations room is a circular-carousel-inspired 3D interface. Five generated chibi spirit portraits are presented as levitating face cards on a perspective orbit. Pointer movement tilts the 3D world. Hovering a card raises its portrait, activates a sheen, and reveals a luminous silhouette. Clicking a card selects its spirit, triggers the black-cloud handoff transition, and opens that spirit’s themed chatspace. The supplied storm loop remains the atmospheric background, while the interface uses electric blue, antique gold, and mythic editorial typography.

The portraits are reserved managed-storage assets generated from the user-supplied chibi mythological reference style. They are referenced in `Home.tsx` through the `/manus-storage/async-images/...` URLs returned by the image pipeline.

## Important files

```text
client/src/pages/Home.tsx       Main workspace, agents, chatspaces, intake, retrieval UI
client/src/index.css            Visual system, 3D carousel, animations, cursor, responsive rules
server/routers.ts               Public Hermes LLM procedure and grounded prompt contract
client/public/manus-routes.json Managed route manifest for the SPA
client/public/media/             Supplied storm loop and public visual assets
vercel.json                     Static Vercel build configuration
TODO.md                         Delivered outcomes and remaining product scope
```

## Local development

From the project root:

```bash
pnpm install
pnpm dev
```

The managed server-backed Preview uses port `3000`. The health endpoint is `/api/health`.

Run the production checks before committing:

```bash
pnpm check
pnpm build
```

## Upload and retrieval behavior

Use the **Source intake** panel in the Hermes room. Text and common source-code files are parsed locally into a source record and chunks. A manual note follows the same visible intake path. PDF and other unsupported binary formats are accepted as unverified metadata until a parser is added; they are never silently included in retrieval. The starter corpus contains cited Devpost judging guidance and MLH member-event guidance in `seedChunks`.

## Deployment notes

The project includes `vercel.json` for the static frontend build. The interactive frontend and local fallback can be deployed as static output. The live Hermes model route requires a server runtime with the managed service environment or an equivalent provider endpoint; a pure static Vercel deployment will need a serverless API adapter and provider credentials if the managed server is not used.

The current managed project has Server enabled for Preview and development. MCP tools remain an optional adapter boundary: the UI shows their state honestly and does not claim external tool execution until a concrete MCP connector is configured.

## Model routing

All model calls stay server-side. `server/routers.ts` exposes `hermes.ask` and `agents.chat`; the browser never receives provider keys. The provider adapter attempts Gemini when `GEMINI_API_KEY` is present, then Groq when `GROQ_API_KEY` is present, and finally the managed Manus LLM route. Hermes always receives the ranked retrieved chunks plus conversation history, while the other spirits receive a role-specific system contract and answer only within their domain. The active provider is shown in each chatspace so the interface does not pretend a provider was used when it was not.
