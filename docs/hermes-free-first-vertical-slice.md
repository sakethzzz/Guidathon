# GUIDATHON free-first agent runtime

## First validated workflow: Hermes

Hermes is the first vertical slice being stabilized before the other four agents are changed.

Request flow:

1. The chat API validates the user question and bounded conversation history.
2. If the signed-in workspace has stored knowledge, Hermes retrieves relevant verified chunks from that workspace.
3. Hermes also queries the public, read-only Wikipedia MCP server for a small set of relevant references.
4. Retrieved text is passed to the model as untrusted evidence, never as instructions.
5. With a configured free-tier model key, Gemini is attempted first and Groq second.
6. Hermes returns its answer, exact chunk citations, provider name, and retrieval-source metadata.
7. If no model key is configured or both providers fail, Hermes returns a clearly labelled evidence-only fallback. It does not pretend that retrieval is generated reasoning.

The same retrieval pipeline is used by \`hermes.ask\` and the normal specialist chat route.

## Free model configuration

GUIDATHON is free-tier-only by default. It never silently falls back to the Manus-managed model.

Configure at least one server-side environment variable in Vercel:

- \`GEMINI_API_KEY\`: recommended first provider. Create an eligible Gemini Developer API key in Google AI Studio and select a model with free-tier quota for the account/project.
- \`GROQ_API_KEY\`: optional second free-tier provider. \`GROQ_MODEL\` controls the model identifier; confirm the selected model is currently available on the account's free tier.

Keys belong only in Vercel Project → Settings → Environment Variables, then redeploy. Never put keys in frontend code, source control, chat messages, or client-side local storage. Free tiers have rate limits and eligibility varies; a key does not guarantee unlimited or zero-cost usage in every account.

The managed Manus route is ignored unless \`ALLOW_PAID_MODEL_FALLBACK=true\` is explicitly set. Leave it false for the chosen free strategy.

## Public MCP source

The default server is \`https://wikipedia.caseyjhand.com/mcp\`, a public read-only Wikipedia MCP server. It requires no API key. The bridge negotiates protocol version \`2025-11-25\`, discovers the server's advertised search tool, and only executes it when the tool explicitly declares \`readOnlyHint: true\`. Both current and legacy search tool names are accepted.

Set \`MCP_SERVER_URL\` only to override the default. The server may be unavailable or rate-limited; Hermes must surface that as a retrieval limitation.

Wikipedia is useful for general background, not authoritative hackathon rules, current product documentation, or legal/medical advice. Prefer the user's uploaded brief, official event rules, and primary sources when those exist.

## Runtime visibility

The public tRPC query \`agents.runtimeStatus\` reports whether Gemini/Groq credentials are present and whether MCP tool discovery succeeds. It returns booleans and safe error text only; it never returns credentials.

## Acceptance test

\`server/hermes-flow.test.ts\` exercises the actual tRPC \`agents.chat\` procedure with no model credentials, a mocked read-only Wikipedia MCP server, and a user question. It asserts that Hermes returns the retrieved evidence, citation ID, source URL, and retrieval counts rather than fabricating a generated model answer.

\`server/mcp.test.ts\` checks protocol headers, dynamic discovery of the Wikipedia search tool name, source URL normalization, and refusal to execute a tool without an explicit read-only annotation.

## Deliberate scope boundary

This slice does not change the existing UI, theme, scroll animation, agent artwork, other agents' prompts, or production branch. It proves Hermes retrieval and honest no-key fallback first. Natural model generation still requires at least one eligible free-tier model API key in the Vercel server environment; no MCP server can replace an LLM.
