# GUIDATHON agent-world MVP: setup and honest capability boundaries

## Architecture

- **Hermes** owns source intake, evidence retrieval, and citations. New text chunks can be persisted per signed-in user in MySQL. When `GEMINI_API_KEY` is configured, Gemini Embedding 001 vectors are stored with each chunk and ranked by cosine similarity. If embeddings are unavailable, the retriever falls back to lexical overlap. Hermes receives retrieved evidence server-side and must distinguish evidence from general knowledge.
- **Zeus** owns orchestration, ownership, context routing, and handoff decisions.
- **Athena** owns idea validation, user pain, differentiation, feasibility, and proof experiments.
- **Hephaestus** owns implementation, architecture, APIs, databases, deployment, and integration boundaries.
- **Chronos** owns milestones, owners, deadlines, dependencies, and submission buffers.

Agent routing is deterministic first: clear specialist intent is handed to that room. Otherwise, the selected agent's model prompt stays role-bounded. This avoids pretending a specialist has completed work outside its domain. The model provider shown in the chat is the provider that actually returned the response, not the preferred provider.

## Environment

Required for server-backed features:

```bash
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
GEMINI_API_KEY=...
GROQ_API_KEY=...
# Optional override
GROQ_MODEL=llama-3.3-70b-versatile
```

- MySQL schema is in `drizzle/schema.ts`.
- Migration: `drizzle/0001_knowledge_chunks.sql`.
- Apply migrations with `pnpm db:migrate` after setting `DATABASE_URL`.
- Gemini key enables embeddings and Gemini chat. Groq can serve chat fallback. The optional managed-provider fallback uses `MANUS_API_URL` and `MANUS_API_KEY`. Without a database, Hermes still uses the visible local starter corpus but uploaded chunks do not persist across sessions.
- A signed-in session is required before the server stores private workspace chunks. Anonymous sessions remain local-only.

## MCP: what it is and how to connect it

MCP (Model Context Protocol) is a standard interface between an AI host and external tools/resources. Think of it as a USB-C port for AI tools: an MCP server advertises named tools and input schemas; the host discovers them with `tools/list` and invokes them with `tools/call`. MCP does not train a model. It gives the agent a controlled way to use external capabilities.

Configure one Streamable HTTP MCP endpoint on the server:

```bash
MCP_SERVER_URL=https://your-mcp-server.example.com/mcp
MCP_SERVER_TOKEN=...
```

The Hephaestus room's MCP Tool Bench discovers tools and lets an authenticated user invoke them. Credentials remain server-side. Only tools explicitly annotated by the MCP server with `readOnlyHint: true` may run without confirmation. Missing or false read-only hints require explicit user confirmation; MCP annotations are advisory, so connect only trusted least-privilege servers. Use a dedicated least-privilege MCP server; do not expose arbitrary shell, unrestricted filesystem, or admin tools to a public demo.

The current adapter supports one configured Streamable HTTP MCP server. It does not claim MCP is connected when the URL is absent. OAuth-based multi-server connection management, resource subscriptions, and automatic LLM tool selection are future work.

## n8n: when it helps

n8n is a workflow automation engine; MCP is a tool protocol. Use n8n for deterministic multi-step processes (e.g. create a task, send a notification, update a spreadsheet) and expose a narrow n8n webhook through an MCP server if an agent needs to trigger it. It does not replace RAG, the database, or the agent router. For this deadline, adding an unconfigured n8n service would add another failure point, so it is intentionally not a required dependency.

## Full-stack deployment\n\nThe existing `Dockerfile` builds the React client and Express/tRPC server together. `render.yaml` provides a Docker-based Render web-service blueprint with `/api/health` as its health check. Add the environment variables in the hosting dashboard; do not commit secrets. The existing `vercel.json` is still a static-client configuration and does not deploy this Express API by itself.\n\n## Safety and testing

- User-provided source text is treated as untrusted reference material, not as model instructions.
- Never claim an external action happened without a successful tool response.
- Model calls remain server-side; never put provider keys in Vite/client environment variables.
- Run `pnpm check`, `pnpm test`, and `pnpm build` before merging.
- The routing test matrix covers research, idea validation, debugging, MCP/database work, deadlines, orchestration, and unrelated safe questions.
- Real provider and MCP integration tests require the deploy environment's secrets and a reachable MCP endpoint; a green local typecheck alone does not prove those integrations are configured.
