# GUIDATHON RAG starter corpus

The current client-side starter corpus is a small, cited set of public hackathon guidance sources. It is intentionally not described as a complete scrape of every hackathon ever held. The UI labels the records as public-source starter data and keeps user uploads separate until they pass the local intake step.

## Sources and chunking

Devpost’s “Step 8: Setting up judging” was read on 2026-10-26. Two chunks are represented in the app under `chunk://devpost-judging/001` and `chunk://devpost-judging/002`. They cover the offline/online judging distinction, organizer-defined 1–5 criteria, judge comments, submission review states, and explicit start/finish controls.

Source: [Devpost · Step 8: Setting up judging](https://help.devpost.com/article/131-setting-up-judging), last updated September 14, 2026.

MLH’s current `member-event-guidelines.md` was read on 2026-10-26. Two chunks are represented in the app under `chunk://mlh-member-events/001` and `chunk://mlh-member-events/002`. They cover the 24–48 hour weekend event shape, end-of-event judging/prize timing, free attendance, student participation, no early elimination rounds, and permission for hackers to use generative AI and LLMs.

Source: [MLH · Member Event Guidelines](https://github.com/MLH/mlh-policies/blob/main/member-event-guidelines.md), 2027 season guidance, last updated May 22, 2026.

## Retrieval behavior

The static Preview uses a transparent token-overlap retriever so users can inspect ranking before the synthesis. Each result exposes a stable chunk ID, source label, passage, match score, and provenance. A future server-side adapter can replace this function with embeddings, a database-backed chunk store, or MCP tools without changing the visible handoff contract.

The next ingestion slice should add a server-side fetch/parse queue with robots.txt and rate-limit compliance, content hashing, heading-aware chunking, source snapshots, and explicit review states. The UI should never promote an unverified scrape to grounded evidence without a successful fetch and parse result.
