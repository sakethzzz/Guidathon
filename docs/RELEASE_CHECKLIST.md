# GUIDATHON release checklist

## Required for a fully authenticated, persistent deployment

Set these in the hosting provider's secret/environment settings (never in Git):
- `DATABASE_URL` — MySQL connection string; required for users, workspaces, conversations, judge history, and persisted knowledge.
- `MANUS_PROJECT_ID` — OAuth/session application identifier.
- `MANUS_JWT_SECRET` — long, random session-signing secret.
- `MANUS_OAUTH_API_URL` — Manus OAuth API base URL.
- At least one model provider: `GEMINI_API_KEY` or `GROQ_API_KEY`.
- `GEMINI_API_KEY` also enables Gemini Embedding 001 for vectorized RAG records.

Optional:
- `GROQ_MODEL` — Groq model override.
- `MANUS_API_URL` and `MANUS_API_KEY` — managed model fallback.
- `MCP_SERVER_URL` and `MCP_SERVER_TOKEN` — external MCP bridge.

## Release gates

Run in this order:
1. `pnpm check`
2. `pnpm test`
3. `pnpm build`
4. Confirm `/api/health` reports `persistentDatabaseConfigured`, `authenticationConfigured`, and at least one model provider as true.
5. Sign in; refresh; confirm the user session remains valid.
6. Create a workspace change; refresh; confirm it persists.
7. Ingest a source; confirm only processed/verified chunks are retrieved.
8. Run one question per agent; confirm provider name, role-specific behavior, and honest fallback labels.
9. Run Judge Arena and inspect the eight criteria and saved evaluation history.
10. Confirm MCP only says connected when a real server responds to discovery.
11. Run browser smoke tests at mobile and desktop widths, in all four visual combinations: dark/light × normal/gold flakes.
12. Inspect network requests for failed assets, repeated polling, long blocking requests, and console errors.

## Known boundaries

- No foundation model is fine-tuned by this repository. Agents use role prompts, server-side model calls, and RAG.
- The starter corpus contains eight curated chunks, not a broad internet scrape.
- The judge heuristic is a labeled fallback, not a live AI evaluation.
- External MCP requires a real HTTPS endpoint and credentials.
- The deployment is not considered fully ready until the API health flags and end-to-end authenticated tests pass.
