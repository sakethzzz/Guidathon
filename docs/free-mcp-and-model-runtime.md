# GUIDATHON: free MCP and model runtime

## Public MCP source (no API key)

The server defaults to the public `@cyanheads/wikipedia-mcp-server` Streamable HTTP endpoint:

`https://wikipedia.caseyjhand.com/mcp`

It is read-only and exposes Wikipedia search, article summaries, article text, sections, nearby pages, and language editions. GUIDATHON uses Wikipedia search as supplemental context for every specialist chat and exposes the advertised tools in the MCP tool bench. Set `MCP_SERVER_URL` only to override this endpoint; set `MCP_SERVER_TOKEN` only if the chosen server requires authentication.

The MCP server is a tool/data provider, **not a language model**. It cannot independently reason, synthesize project decisions, or generate natural conversational answers.

## Model runtime

Open-ended agent generation still uses the existing provider-agnostic route in `server/routers.ts`: Gemini, Groq, then the Manus-managed model route. At least one provider must be configured in the Vercel project environment for generated answers. Credentials stored in a separate Manus workspace do not automatically become Vercel environment variables.

If every model route is unavailable, GUIDATHON returns an exact prepared playbook answer when one exists; otherwise it returns retrieved Wikipedia references with an explicit label that no generated answer was produced. It does not claim that MCP is an LLM or that a prepared response is live model inference.

For a genuinely no-key LLM, the app would need to run model inference locally in the browser/device or connect to a publicly hosted anonymous inference service. No stable, production-grade anonymous inference endpoint is currently configured or verified here. Browser-local models also require a substantial model download and WebGPU-capable hardware, so they should not be silently treated as a universal mobile fallback.

## Agent responsibilities

- Hermes: RAG retrieval, source provenance, evidence gaps, citations.
- Zeus: shared project state, specialist routing, explicit handoffs and coordination.
- Athena: idea generation, comparative validation, decision criteria and risks.
- Hephaestus: architecture, stack selection, implementation plan and integration safety.
- Chronos: actual deadline-aware milestones, dependencies, owners and submission checks.

The five agents share project context but retain their specialist system prompts. External MCP tools remain read-only by default; potentially mutating tools require explicit confirmation.

## 3D preview

The constellation viewer uses Three.js meshes for the orbital rings, beveled reliquary frame, lighting and pedestal, with the selected agent artwork rendered on a transparent textured plane. This is a dimensional 2.5D presentation, not a fully rigged/sculpted 3D character model.