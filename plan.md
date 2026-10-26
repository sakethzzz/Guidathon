# GUIDATHON — Evidence to Outcome

## Implementation approach

Build a single-page, static-first React experience that makes the multi-agent workflow observable without requiring external credentials. The UI will own a small in-browser corpus of authoritative hackathon notes plus user-added text/file metadata. A deterministic local retrieval pipeline will normalize input into chunks, score chunks against a query using token overlap, and return citations, chunk IDs, provenance, and an explicit `grounded` or `fallback` state. This is intentionally transparent: the user can see what was retrieved before seeing the answer.

The guided flow starts in Hermes onboarding, then exposes a handoff summary and routes work to the next useful agent. Agent rooms are represented as a responsive horizontal carousel/rail with the selected spirit enlarged and adjacent spirits visible. Selecting an agent changes the work surface and shows role context, latest handoff, activity events, and concrete outputs. A single shared workspace state keeps onboarding answers, source records, retrieval results, idea hypotheses, stack decisions, and timeline tasks consistent across rooms. Upload is implemented with a browser file input; text files are read locally, while other file types enter intake as unverified with visible metadata and a preview-state note.

The first delivery deliberately avoids pretending to have a live MCP/LLM connection. Integration badges distinguish `local demo`, `unverified`, and `unavailable`; architecture notes in the UI explain where a future server-side RAG/MCP adapter would replace the local retrieval function. The app remains fully usable in Preview with no secrets, database, or login.

## Project structure

- `client/src/pages/Home.tsx`: guided journey state, sidebar, agent rail, onboarding, room work surfaces, retrieval, idea/stack/timeline outputs.
- `client/src/index.css`: storm-backed canvas, translucent panels, typography, agent avatars, line-sidebar treatment, responsive and reduced-motion rules.
- `client/src/App.tsx`: single-page route shell.
- `public/manus-routes.json`: route manifest for `/` and `/404`.
- `app.config.ts`: project logo metadata placeholder using a durable inline SVG data-free HTTPS-compatible asset URL when available; keep literal and quoted.
- `plan.md` and `TODO.md`: implementation decisions and outcome criteria.

## Design

### Style options

- Cinematic mythic editorial — 0.07
- Celestial command console — 0.06
- Soft game-like mentor chamber — 0.05

Chosen: **cinematic mythic editorial**.

### Design movement

An editorial command center where mythic character, evidence traces, and storm atmosphere share the same frame.

### Core principles

1. Keep the storm visible behind the work, but preserve readable translucent surfaces.
2. Every meaningful action produces a visible artifact: chunk, citation, hypothesis, stack decision, or deadline.
3. Antique gold marks agency, evidence, and handoffs; electric blue marks routing and live work.
4. Surface uncertainty honestly instead of hiding unavailable integrations behind success copy.

### Color philosophy

Obsidian navy supplies depth for the storm field, electric blue preserves the lightning signal and agent-routing energy, and antique storm-gold `#e8c56b` is reserved for verified evidence, selected actions, and the constellation path.

### Layout paradigm

Asymmetric command center: a persistent line sidebar anchors orientation, a wide editorial workfield holds the current room, and the agents live in a flex rail that behaves like a circular carousel rather than a grid of equal cards.

### Signature elements

- Storm-blue radial field with subtle moving grain and gold flakes.
- Levitating spirit avatars built from layered glow, rings, and glyphs rather than generic portraits.
- Thin line navigation and evidence IDs that make the experience feel like an instrument panel.

### Interaction philosophy

Clicking an agent is a meaningful handoff. The selected room always states what it received, what it is doing, and what it produced. Retrieval surfaces source chunks before the synthesis. Uploads become `unverified` until the local intake pass completes.

### Animation

Use slow float and shimmer for avatars, short cloud/gold transition flashes for room changes, and no autoplay audio. Respect `prefers-reduced-motion` by disabling continuous transforms, flakes, and transition sweeps.

### Typography system

Use DM Serif Display for hero and room headings, IBM Plex Sans for interface copy, and IBM Plex Mono for evidence IDs, statuses, scores, and system events. Hierarchy is compact and editorial: small uppercase system labels, large serif room title, then concise sans-serif explanation.

### Brand essence

A source-grounded mentor constellation that helps hackathon teams move from ambiguity to a defensible submission. Personality: calm, exacting, mythic.

### Brand voice

Direct, reassuring, evidence-aware. Example lines: “Tell Hermes where you are stuck; the constellation will route the next useful move.” and “Unknown is a valid result when the source does not establish the claim.”

### Wordmark & logo

`GUIDATHON` in uppercase serif with a four-point spark/sigil in the center of the wordmark, followed by the small lockup `evidence / action / outcome`.

### Signature brand color

Antique storm-gold `#e8c56b`.

## Build workflow

Implement the page and style first, add the route manifest before the dev server starts, run TypeScript diagnostics and static build checks, start the configured preview service, inspect the rendered result, then checkpoint the working files to the managed remote. No external secrets are required for this slice.
