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

The current managed project has Server enabled for Preview and development. For a Render deployment, configure DATABASE_URL, MANUS_PROJECT_ID, MANUS_JWT_SECRET, MANUS_OAUTH_API_URL, and at least one model provider key. MANUS_API_URL and MANUS_API_KEY enable the optional managed-model fallback; MCP_SERVER_URL and MCP_SERVER_TOKEN enable the optional MCP bridge. The repository includes a placeholder-only .env.example and Render environment declarations; real credentials must be added in the hosting provider's secret settings and must never be committed. MCP tools remain an optional adapter boundary: the UI shows their state honestly and does not claim external tool execution until a concrete MCP connector is configured.

## Model routing

All model calls stay server-side. `server/routers.ts` exposes `hermes.ask` and `agents.chat`; the browser never receives provider keys. The provider adapter attempts Gemini when `GEMINI_API_KEY` is present, then Groq when `GROQ_API_KEY` is present, and finally the managed Manus LLM route. Hermes always receives the ranked retrieved chunks plus conversation history, while the other spirits receive a role-specific system contract and answer only within their domain. The active provider is shown in each chatspace so the interface does not pretend a provider was used when it was not.


## Persistence and evidence trust

The current knowledge store uses MySQL through Drizzle. When GEMINI_API_KEY is configured, chunks are embedded with Gemini Embedding 001 (768 dimensions); vectors are serialized in the MySQL knowledge_chunks.embedding column and ranked with cosine similarity in the application. If an individual vector is unavailable, retrieval can use lexical overlap. This is an application-managed vector retrieval MVP, not a dedicated vector database or a MySQL native vector index.

Knowledge ingestion is authenticated and scoped to the signed-in user's workspace. Newly uploaded chunks begin as unverified. After supported text parsing completes, the client asks the server to mark those exact workspace-owned chunk IDs as processed. In this app, verified means the intake/parse step completed; it does not mean the factual claims in a user-uploaded document were independently fact-checked. Browser-supplied context is labeled unverified and is never silently persisted by chat requests. Persistent retrieval only returns processed chunks from the current user's workspace.

The Judge Arena uses an eight-dimension weighted rubric and calculates the final score server-side. The evaluator is instructed to penalize missing proof; 94/100 is an aspirational quality bar, not a default or guaranteed result.


## Durable workspace persistence

When a user is authenticated and `DATABASE_URL` is configured, GUIDATHON now restores and autosaves the active project workspace. The versioned owner-scoped snapshot includes the challenge brief, onboarding context, source ledger, Hermes transcript, idea/build outputs, submission notes, theme, and recent activity. Autosave is debounced and the top bar reports the workspace save state.

Specialist agent conversations are stored independently per owner and agent, so switching rooms does not merge transcripts. Judge Arena results are saved as append-only history (latest ten shown in the UI). These features require the authenticated MySQL deployment and migration `0002_workspace_persistence.sql`; anonymous preview sessions remain local-only.

The current product intentionally supports one default workspace per account. Named projects, editable timeline tasks, and database-backed integration tests remain follow-up work.
