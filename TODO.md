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
