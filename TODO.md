# GUIDATHON delivery outcomes

## Hermes onboarding and visible handoff

- [x] The first workspace state is Hermes onboarding and asks what the user is here to do, what event they are entering, what sources or problem statement they have, their team/time constraints, and the main uncertainty.
- [x] Completing onboarding creates a visible handoff summary containing the answers and routes the next action to RAG, Zeus, Athena, Hephaestus, or Chronos.
- [x] The UI never collapses an agent turn into only a “done” state; each handoff shows received context, current work, and a concrete artifact.

## Spirit rooms and navigation

- [x] Six visible spirit agents exist: Hermes (guide), RAG agent (evidence), Zeus (orchestrator), Athena (idea analysis), Hephaestus (stack/workflow), and Chronos (time/submission).
- [x] Agents use a flex/circular-carousel-like presentation with a selected spirit enlarged and nearby spirits visible.
- [x] The navigation uses a line-sidebar treatment and keeps Overview, Sources, Challenge Brief, Idea Lab, Technical Plan, Timeline & Tasks, Submission Readiness, and Settings reachable.
- [x] Room changes show a restrained cloud/gold transition cue and support reduced motion.

## Working RAG intake and retrieval

- [x] RAG is a first-class room with visible source intake, including upload/file selection and manual notes.
- [x] New inputs enter as unverified, then show a local processing/intake state and become retrievable only after processing.
- [x] Retrieval answers show source title/URL or local-file label, stable chunk IDs, passage text, score/match metadata, and explicit grounded/fallback state.
- [x] The UI displays retrieved chunks before the synthesized answer so the user can see what the RAG step found.
- [x] Unavailable external integrations are labeled honestly rather than shown as connected.

## Agent outputs

- [x] Athena turns the challenge/context into idea hypotheses, shows trade-offs, and recommends one direction.
- [x] Hephaestus suggests a practical implementation stack and workflow with rationale and an explicit local-demo integration state.
- [x] Chronos turns a target date and milestones into dated tasks/deadlines with progress status.
- [x] Zeus shows orchestration state and an activity stream of agent-to-agent events.

## Visual system and delivery

- [x] Storm-backed translucent panels, electric blue routing, antique storm-gold #e8c56b evidence marks, DM Serif Display, IBM Plex Sans, and IBM Plex Mono are applied consistently.
- [x] The page is responsive and readable at desktop and mobile widths.
- [x] `/manus-routes.json` is served and matches the implemented route set.
- [x] TypeScript and static build checks pass, and the configured preview service serves the working page.

## Cinematic entry and interaction layer

- [x] The supplied 5.18-second storm loop is served from `/media/guidathon-storm-loop.mp4`, plays muted and loops on the landing screen and behind the main workspace.
- [x] The landing screen starts with only a bottom-center “click anywhere to begin” cue, then reveals the GUIDATHON wordmark with a smooth slide/sweep before exposing the workspace.
- [x] The cursor is replaced by a lightning glyph with a glitter trail; clicking interactive controls creates a temporary spark and a short synthesized spark sound. No passive thunder sound plays.
- [x] The line-sidebar active state has a traveling beam/pulse animation and reduced-motion support.

## Dedicated agents room

- [x] An Agents navigation room is available with a circular/orbital carousel for Hermes, RAG, Zeus, Athena, Hephaestus, and Chronos.
- [x] Selecting an agent in the carousel updates the active spirit and preserves the shared handoff context.

## Public-source corpus and deployment

- [x] The starter RAG corpus contains cited, chunked public guidance from Devpost judging setup and MLH member-event guidelines, with stable chunk IDs and source provenance.
- [x] The corpus scope is documented honestly as a starter set rather than a claim of a complete scrape of all hackathons.
- [x] `vercel.json` defines a Vite static build using `pnpm build:static` and `dist/public`.

## Hermes model-backed knowledge flow

- [x] Hermes is the single evidence and knowledge spirit; the standalone RAG tile is removed.
- [x] The Hermes room accepts natural-language questions, ranks verified chunks, sends the question plus citations to a server-side LLM route, renders the answer transcript, and shows attached chunk IDs and provenance.
- [x] If the managed model route is unavailable, Hermes returns a transparent local evidence fallback instead of claiming a model answer.
- [x] The Hermes intake panel accepts briefs, notes, and common text/source-code files for local chunking; PDF metadata remains visibly unverified until a parser is added.
- [x] Athena, Hephaestus, and Chronos remain downstream working rooms, and Constellations adds scoped role-chat panels for every spirit.
- [x] Agent selection creates a visible cloud-curtain handoff transition with the source and destination context.

## 3D Constellations upgrade

- [x] The Constellations room now uses a circular-carousel-inspired 3D world with five levitating face cards rather than flat agent tiles.
- [x] Each spirit has a generated chibi portrait asset inspired by the supplied mythological reference style, with a distinct theme, accent, quote, and card identity.
- [x] Pointer movement tilts the 3D world; hovering a card raises the portrait, activates a sheen, and reveals a luminous silhouette treatment.
- [x] Selecting a spirit opens its themed role chatspace and shows a dramatic black-cloud handoff transition.
- [x] All five role chats now vary their replies by agent and question intent instead of repeating one generic answer.
- [x] README documents the platform flow, server Hermes route, upload/retrieval behavior, 3D Constellations room, local development, and deployment caveat.

## Model-backed role intelligence and cloud gate

- [x] Agent-to-agent handoffs now use a 2.1-second opaque full-screen cloud gate with dark storm layers, smooth in/out motion, and centered context copy.
- [x] Hermes keeps ranked retrieved chunks attached to a server-side model prompt and returns citations with the answer.
- [x] Hermes and all five role chats now use the server-side multi-provider adapter: Gemini when configured, Groq when configured, then the managed Manus LLM fallback.
- [x] Provider labels are visible in each role chat, and chat history resets when changing spirits so one agent never inherits another agent’s transcript.

## Constellations harmony pass

- [x] Selecting a spirit rotates the circular orbit so that spirit becomes the front-facing active card and updates the center focus, accent glow, handoff strip, and chatspace together.
- [x] Each agent chat is now presented as a themed console with provider status, role-locked transcript, empty state, thinking state, and an integrated send control rather than a detached utility panel.

## Prompt-aligned experience pass

- [x] The question-mark control opens a creator/site explainer naming the site purpose and Saketh’s authorship, with an animated modal entry path back into the constellation.
- [x] Overview includes a GSAP ScrollTrigger-powered agent stack that assembles on scroll and ends with the GUIDATHON motto.
- [x] Constellations uses a ReactBits-inspired circular orbit with continuous rotation state, focus-on-selection, front-card rotation, pointer tilt, and selected-agent description/chat pairing.
- [x] Sources is a Hermes evidence ledger; Submission Readiness is a Zeus repo/file intake desk with live score inputs and correction messaging; Settings includes light/dark mode and agent history.
- [x] Athena’s Idea Lab accepts the user’s problem or idea and requests scaled alternatives, a recommendation, and a proof experiment through the live agent model route.
- [x] The message button opens a user-to-admin support channel inside the site.
- [x] Blue/gold flakes and translucent motion remain part of the global storm field, with reduced-motion support inherited from the existing animation system.

## Live provider and immersive 3D pass

- [x] Gemini is the preferred live provider for Hermes and Athena; Groq is the preferred live provider for Zeus, Hephaestus, and Chronos, with explicit managed-model fallback when a provider credential is unavailable.
- [x] The Constellations room now has a real Three.js ShaderMaterial atmosphere, pointer parallax, continuous drift, drag-to-rotate, release snapping, hover pause, and click-to-focus behavior inspired by ReactBits Circular Carousel and GSAP Draggable.
- [x] Athena, Zeus, Hephaestus, and Chronos each expose a themed role-locked model chat inside their dedicated room rather than relying on a generic shared panel.
- [x] Chronos progress now reflects the current readiness score and project completion signals instead of a fixed progress value.
- [x] Thunder ambience starts only after workspace entry, then cues approximately every seven seconds and again at storm-loop boundaries so browser autoplay restrictions are respected.

## ReactBits interaction alignment

- [x] Constellations uses a true Y-axis circular carousel so dragging rotates the ring and clicking a specific face card snaps that card to the front while keeping its themed chatspace selected.
- [x] The carousel keeps cursor parallax, hover pause/tilt, autoplay drift, release snapping, keyboard-accessible card buttons, and reduced-motion behavior.
- [x] The workspace sidebar now uses an Animated List-style pattern with staggered row entry, a gliding active selection, hover shift, arrow-key navigation, and the existing evidence count.

## Simplified mythic room architecture

- [x] Constellations is now a circle-only room: the interactive 3D agent carousel remains, while the global agent rail, activity trace, and submission-readiness blocks are removed from that view.
- [x] Overview is now quote-led and follows a Scroll Stack composition with five mythological agent cards, each showing its chibi, aura, Greek-myth role rationale, project responsibility, and a click path into the Sources room.
- [x] Sources now opens a draggable/selectable carousel of all five chibi agents. Selecting an agent reveals a personalized room with a cursor-reactive model-viewer-style chibi stage, themed model chat, a choose-your-next-room column, and visible MCP extension affordances.
- [x] Agent handoffs now add a nostalgic cloud curtain with a visible lightning strike instead of only a flat color wipe.
- [x] Athena’s idea scaling request now instructs the live model to compare four directions, score user pain/differentiation/proof/risk/scope, reject weak options, select a winner, and produce a smallest proof experiment.
