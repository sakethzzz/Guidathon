import {
  ArrowUpRight,
  Bot,
  CalendarClock,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  GitBranch,
  Inbox,
  Layers3,
  Link2,
  MessageSquareText,
  Network,
  Paperclip,
  Play,
  Plus,
  Radar,
  Search,
  Settings2,
  Sparkles,
  Target,
  Timer,
  UploadCloud,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";

type AgentId = "hermes" | "rag" | "zeus" | "athena" | "hephaestus" | "chronos";
type NavId =
  | "Overview"
  | "Sources"
  | "Challenge Brief"
  | "Idea Lab"
  | "Technical Plan"
  | "Timeline & Tasks"
  | "Submission Readiness"
  | "Settings";

type SourceRecord = {
  id: string;
  name: string;
  kind: "fixture" | "upload" | "note";
  status: "verified" | "processing" | "unverified";
  chunks: Chunk[];
  detail: string;
};

type Chunk = {
  id: string;
  source: string;
  heading: string;
  passage: string;
  score?: number;
  provenance: string;
};

type Activity = {
  id: string;
  agent: AgentId;
  action: string;
  detail: string;
  time: string;
  state: "complete" | "live" | "queued";
};

type Task = {
  title: string;
  date: string;
  owner: string;
  status: "next" | "queued" | "done";
};

const agents: Array<{
  id: AgentId;
  name: string;
  role: string;
  short: string;
  glyph: string;
  accent: string;
}> = [
  { id: "hermes", name: "Hermes", role: "Guide", short: "Frames the mission", glyph: "✦", accent: "blue" },
  { id: "rag", name: "RAG", role: "Evidence", short: "Finds what is true", glyph: "⌁", accent: "gold" },
  { id: "zeus", name: "Zeus", role: "Orchestrator", short: "Routes the next move", glyph: "ϟ", accent: "violet" },
  { id: "athena", name: "Athena", role: "Idea analysis", short: "Tests the thesis", glyph: "Δ", accent: "rose" },
  { id: "hephaestus", name: "Hephaestus", role: "Stack + workflow", short: "Turns plans buildable", glyph: "⌘", accent: "orange" },
  { id: "chronos", name: "Chronos", role: "Time + submission", short: "Makes time visible", glyph: "◷", accent: "teal" },
];

const navItems: Array<{ id: NavId; label: string; icon: typeof Radar }> = [
  { id: "Overview", label: "Overview", icon: Radar },
  { id: "Sources", label: "Sources", icon: FileText },
  { id: "Challenge Brief", label: "Challenge Brief", icon: Target },
  { id: "Idea Lab", label: "Idea Lab", icon: Sparkles },
  { id: "Technical Plan", label: "Technical Plan", icon: GitBranch },
  { id: "Timeline & Tasks", label: "Timeline & Tasks", icon: CalendarClock },
  { id: "Submission Readiness", label: "Submission Readiness", icon: Check },
  { id: "Settings", label: "Settings", icon: Settings2 },
];

const seedChunks: Chunk[] = [
  {
    id: "chunk://hackathon-brief/001",
    source: "Hackathon judging brief",
    heading: "What strong submissions make clear",
    passage: "A strong submission makes the user, the painful moment, and the measurable change explicit. Judges should understand the before and after without reverse-engineering the demo.",
    provenance: "fixture · permitted public brief · 2026",
  },
  {
    id: "chunk://hackathon-brief/002",
    source: "Hackathon judging brief",
    heading: "Evidence over feature volume",
    passage: "Teams earn confidence by showing one evidence-backed workflow end to end. Feature count is less persuasive than a crisp proof that the core loop works.",
    provenance: "fixture · permitted public brief · 2026",
  },
  {
    id: "chunk://mentor-notes/001",
    source: "Mentor field notes",
    heading: "Scope the first build",
    passage: "Choose one user, one moment, and one action that can be improved in a weekend. Keep the first build narrow enough to observe with real people.",
    provenance: "fixture · curated mentor notes · 2026",
  },
  {
    id: "chunk://mentor-notes/002",
    source: "Mentor field notes",
    heading: "Explain the trade-off",
    passage: "A defensible technical plan names the shortcut, the risk it creates, and the signal that would tell the team to invest in a harder path later.",
    provenance: "fixture · curated mentor notes · 2026",
  },
];

const initialSources: SourceRecord[] = [
  {
    id: "src-brief",
    name: "hackathon-brief.md",
    kind: "fixture",
    status: "verified",
    chunks: seedChunks.slice(0, 2),
    detail: "Fixture corpus · cited and ready",
  },
  {
    id: "src-notes",
    name: "mentor-field-notes.txt",
    kind: "fixture",
    status: "verified",
    chunks: seedChunks.slice(2),
    detail: "Fixture corpus · cited and ready",
  },
];

const initialActivity: Activity[] = [
  { id: "a1", agent: "hermes", action: "Opened the constellation", detail: "Waiting for your challenge context.", time: "now", state: "live" },
  { id: "a2", agent: "rag", action: "Loaded fixture corpus", detail: "4 cited chunks are ready for retrieval.", time: "09:41", state: "complete" },
  { id: "a3", agent: "zeus", action: "Integration check", detail: "MCP bridge is not connected in this demo.", time: "09:40", state: "queued" },
];

const tasks: Task[] = [
  { title: "Lock one user + painful moment", date: "Today · 18:00", owner: "Athena", status: "next" },
  { title: "Prototype the evidence loop", date: "Tomorrow · 12:00", owner: "Hephaestus", status: "queued" },
  { title: "Run 3 user observations", date: "Wed · 16:00", owner: "Hermes", status: "queued" },
  { title: "Record the 90s demo", date: "Thu · 20:00", owner: "Zeus", status: "queued" },
];

function tokenize(value: string) {
  return new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean));
}

function scorePassage(query: string, passage: string) {
  const terms = tokenize(query);
  const words = tokenize(passage);
  if (!terms.size) return 0;
  let overlap = 0;
  terms.forEach(term => {
    if (words.has(term)) overlap += 1;
  });
  return Math.min(0.98, 0.42 + (overlap / terms.size) * 0.56);
}

function splitIntoChunks(text: string, source: string, prefix: string): Chunk[] {
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const groups: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    groups.push(sentences.slice(index, index + 2).join(" "));
  }
  return (groups.length ? groups : [text.trim()]).filter(Boolean).map((passage, index) => ({
    id: `chunk://${prefix}/${String(index + 1).padStart(3, "0")}`,
    source,
    heading: index === 0 ? "User-provided context" : `Context fragment ${index + 1}`,
    passage,
    provenance: "user intake · local parse · unverified provenance",
  }));
}

function agentById(id: AgentId) {
  return agents.find(agent => agent.id === id) ?? agents[0];
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavId>("Overview");
  const [activeAgent, setActiveAgent] = useState<AgentId>("hermes");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [challenge, setChallenge] = useState("Build a trustworthy AI mentor for hackathon teams");
  const [event, setEvent] = useState("Guidathon 2026");
  const [team, setTeam] = useState("3 builders · 48 hours");
  const [uncertainty, setUncertainty] = useState("Which idea is narrow enough to ship and strong enough to demo?");
  const [query, setQuery] = useState("What makes a hackathon idea defensible?");
  const [sources, setSources] = useState<SourceRecord[]>(initialSources);
  const [activities, setActivities] = useState<Activity[]>(initialActivity);
  const [retrieval, setRetrieval] = useState<Chunk[]>([]);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [manualNote, setManualNote] = useState("");
  const [ideaRun, setIdeaRun] = useState(false);
  const [stackRun, setStackRun] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allChunks = useMemo(() => sources.filter(source => source.status === "verified").flatMap(source => source.chunks), [sources]);
  const selected = agentById(activeAgent);
  const readyCount = sources.filter(source => source.status === "verified").length;
  const activeNavAgent: Partial<Record<NavId, AgentId>> = {
    Sources: "rag",
    "Challenge Brief": "hermes",
    "Idea Lab": "athena",
    "Technical Plan": "hephaestus",
    "Timeline & Tasks": "chronos",
    "Submission Readiness": "zeus",
  };

  const pushActivity = (agent: AgentId, action: string, detail: string, state: Activity["state"] = "complete") => {
    setActivities(current => [
      { id: `${Date.now()}-${Math.random()}`, agent, action, detail, time: "now", state },
      ...current,
    ].slice(0, 7));
  };

  const selectAgent = (id: AgentId) => {
    setActiveAgent(id);
    setActiveNav("Overview");
    pushActivity("zeus", `Routed context to ${agentById(id).name}`, `${selected.name} → ${agentById(id).name}: ${uncertainty || "open question"}`, "live");
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    setActiveAgent("zeus");
    pushActivity("hermes", "Created the mission handoff", `${event} · ${team} · uncertainty captured`, "complete");
    pushActivity("zeus", "Selected next move", "Route to RAG first, then Athena for idea pressure-testing.", "live");
  };

  const runRetrieval = () => {
    setIsRetrieving(true);
    pushActivity("rag", "Scanning verified chunks", `Query: ${query || "(empty)"}`, "live");
    window.setTimeout(() => {
      const ranked = allChunks
        .map(chunk => ({ ...chunk, score: scorePassage(query, `${chunk.heading} ${chunk.passage}`) }))
        .filter(chunk => (chunk.score ?? 0) > 0.44)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3);
      setRetrieval(ranked);
      setIsRetrieving(false);
      pushActivity("rag", ranked.length ? "Returned grounded evidence" : "Returned a safe fallback", ranked.length ? `${ranked.length} chunks cited · local retrieval` : "No verified chunk established this claim.", "complete");
    }, 520);
  };

  const addSource = (record: SourceRecord) => {
    setSources(current => [record, ...current]);
    window.setTimeout(() => {
      setSources(current => current.map(source => source.id === record.id ? { ...source, status: "verified", detail: `${record.chunks.length} chunks · local parse complete` } : source));
      pushActivity("rag", "Processed a new source", `${record.name} is now searchable but still locally verified only.`, "complete");
    }, 760);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedName(file.name);
    const isText = file.type.startsWith("text/") || /\.(md|txt|csv|json)$/i.test(file.name);
    let text = `File ${file.name} was added to the intake queue. This file type is visible, but the local demo could not parse its contents yet.`;
    if (isText) {
      try {
        text = await file.text();
      } catch {
        text = `File ${file.name} was added, but its contents could not be read in this browser.`;
      }
    }
    const record: SourceRecord = {
      id: `src-${Date.now()}`,
      name: file.name,
      kind: "upload",
      status: "processing",
      chunks: splitIntoChunks(text, file.name, `upload-${Date.now()}`),
      detail: isText ? "Reading locally · intake in progress" : "Metadata captured · content unverified",
    };
    addSource(record);
    pushActivity("rag", "Accepted an upload", `${file.name} entered intake as unverified.`, "live");
    event.target.value = "";
  };

  const addManualNote = () => {
    if (!manualNote.trim()) return;
    const record: SourceRecord = {
      id: `src-${Date.now()}`,
      name: "manual-note.md",
      kind: "note",
      status: "processing",
      chunks: splitIntoChunks(manualNote, "manual-note.md", `note-${Date.now()}`),
      detail: "Manual note · intake in progress",
    };
    addSource(record);
    setManualNote("");
    pushActivity("rag", "Accepted a manual note", "The note is being chunked before it can influence answers.", "live");
  };

  const switchNav = (id: NavId) => {
    setActiveNav(id);
    const mappedAgent = activeNavAgent[id];
    if (mappedAgent) setActiveAgent(mappedAgent);
  };

  const renderRoom = () => {
    if (activeAgent === "rag") {
      return (
        <div className="room-body rag-room">
          <div className="room-column">
            <div className="section-kicker"><span className="kicker-dot gold" /> Retrieval console</div>
            <div className="query-box">
              <Search size={16} />
              <input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === "Enter" && runRetrieval()} placeholder="Ask the corpus a grounded question…" />
              <button className="small-action" onClick={runRetrieval} disabled={isRetrieving}>{isRetrieving ? "Scanning" : "Retrieve"}<ArrowUpRight size={14} /></button>
            </div>
            <div className="retrieval-state"><span className="status-dot live" /> local retriever · {readyCount} verified sources · {allChunks.length} chunks</div>
            {retrieval.length > 0 ? (
              <div className="retrieval-results">
                <div className="result-heading"><span>Retrieved evidence</span><span className="mono">top {retrieval.length} matches</span></div>
                {retrieval.map(chunk => (
                  <div className="chunk-card" key={chunk.id}>
                    <div className="chunk-meta"><span className="mono chunk-id">{chunk.id}</span><span className="score">match {Math.round((chunk.score ?? 0) * 100)}%</span></div>
                    <h4>{chunk.heading}</h4>
                    <p>{chunk.passage}</p>
                    <div className="chunk-source"><Link2 size={12} /> {chunk.source} · {chunk.provenance}</div>
                  </div>
                ))}
                <div className="synthesis-card"><div className="synthesis-label"><Sparkles size={13} /> grounded synthesis</div><p>Make the idea defensible by narrowing it to one user, one painful moment, and one observable improvement. Lead the demo with the evidence loop, not the feature list.</p><span className="grounded-badge"><Check size={12} /> GROUNDED IN {retrieval.length} CHUNKS</span></div>
              </div>
            ) : (
              <div className="empty-retrieval"><Bot size={22} /><p>Run a query to see which chunks RAG retrieves, why they matched, and what the answer can safely claim.</p></div>
            )}
          </div>
          <SourceIntake sources={sources} manualNote={manualNote} setManualNote={setManualNote} addManualNote={addManualNote} onUpload={() => fileInputRef.current?.click()} uploadedName={uploadedName} />
        </div>
      );
    }

    if (activeAgent === "athena") {
      return (
        <div className="room-body split-room">
          <div className="room-column">
            <div className="section-kicker"><span className="kicker-dot rose" /> Thesis pressure test</div>
            <h3>Three paths from the same uncertainty.</h3>
            <p className="room-intro">Athena keeps the strongest idea small enough to prove, while naming the trade-off you are accepting.</p>
            <div className="hypothesis-list">
              <div className="hypothesis recommended"><div className="hypothesis-top"><span className="hypothesis-index">01</span><span className="recommended-tag">recommended</span></div><h4>Evidence-first mentor</h4><p>Turn a team&apos;s messy brief into one cited decision and one buildable next move.</p><div className="hypothesis-foot"><span>Impact <b>high</b></span><span>Scope <b>focused</b></span><span>Proof <b>visible</b></span></div></div>
              <div className="hypothesis"><div className="hypothesis-top"><span className="hypothesis-index">02</span><span className="muted-label">wider bet</span></div><h4>Autonomous team planner</h4><p>Route the entire team from brief to tasks, but risk hiding where judgment enters.</p><div className="hypothesis-foot"><span>Impact <b>high</b></span><span>Scope <b>wide</b></span><span>Proof <b>mixed</b></span></div></div>
              <div className="hypothesis"><div className="hypothesis-top"><span className="hypothesis-index">03</span><span className="muted-label">safe bet</span></div><h4>RAG answer desk</h4><p>Answer event questions with citations, but underplays the agent handoff story.</p><div className="hypothesis-foot"><span>Impact <b>medium</b></span><span>Scope <b>focused</b></span><span>Proof <b>clear</b></span></div></div>
            </div>
            <button className="primary-button" onClick={() => { setIdeaRun(true); pushActivity("athena", "Recommended a direction", "Evidence-first mentor · high impact / focused scope", "complete"); }}><WandSparkles size={16} /> {ideaRun ? "Recommendation locked" : "Ask Athena to decide"}</button>
          </div>
          <div className="decision-card"><div className="decision-icon"><Sparkles size={18} /></div><div><span className="section-kicker">Athena&apos;s read</span><h3>Make the evidence loop the product.</h3><p>Your uncertainty is scope, not novelty. The defensible move is to prove that a team can move from ambiguity to a cited, buildable decision in minutes.</p><div className="decision-line"><Check size={14} /> Handoff ready for Hephaestus</div></div></div>
        </div>
      );
    }

    if (activeAgent === "hephaestus") {
      return (
        <div className="room-body split-room">
          <div className="room-column">
            <div className="section-kicker"><span className="kicker-dot orange" /> Buildable path</div>
            <h3>A stack that keeps the demo honest.</h3>
            <p className="room-intro">Hephaestus chooses the smallest architecture that can expose retrieval, handoffs, and a credible path to production.</p>
            <div className="stack-list">
              {[['React + Vite', 'Fast local workspace with transparent state.'], ['TypeScript', 'Keeps agent contracts and chunk metadata explicit.'], ['Local RAG → pgvector', 'Start with visible token scoring; swap in embeddings when corpus grows.'], ['MCP adapter', 'One boundary for tools, source ingestion, and future model calls.']].map(([name, detail], index) => <div className="stack-row" key={name}><span className="stack-number">0{index + 1}</span><div><b>{name}</b><p>{detail}</p></div><span className="stack-state">{index === 2 ? "NEXT" : "READY"}</span></div>)}
            </div>
            <button className="primary-button" onClick={() => { setStackRun(true); pushActivity("hephaestus", "Proposed the build stack", "React + TypeScript + local RAG now; MCP + pgvector next.", "complete"); }}><Zap size={16} /> {stackRun ? "Stack staged" : "Stage technical plan"}</button>
          </div>
          <div className="architecture-card"><div className="architecture-top"><span className="section-kicker">Architecture signal</span><span className="integration-pill mocked">local demo</span></div><div className="architecture-flow"><span>source intake</span><ChevronRight size={14} /><span>chunk store</span><ChevronRight size={14} /><span>agent router</span><ChevronRight size={14} /><span>output</span></div><p>No hidden calls. Every boundary is inspectable now; the future server adapter can replace one node at a time.</p><div className="architecture-note"><CircleHelp size={14} /> MCP bridge unavailable · not represented as connected</div></div>
        </div>
      );
    }

    if (activeAgent === "chronos") {
      return (
        <div className="room-body split-room">
          <div className="room-column">
            <div className="section-kicker"><span className="kicker-dot teal" /> Deadline engine</div>
            <h3>Time becomes another handoff.</h3>
            <p className="room-intro">Chronos turns the chosen direction into a sequence the team can actually follow. Dates are demo defaults until you edit them.</p>
            <div className="task-list">{tasks.map(task => <div className="task-row" key={task.title}><div className={`task-check ${task.status === "done" ? "checked" : ""}`}>{task.status === "done" && <Check size={12} />}</div><div className="task-main"><b>{task.title}</b><span>{task.owner} · {task.date}</span></div><span className={`task-status ${task.status}`}>{task.status}</span></div>)}</div>
            <button className="primary-button" onClick={() => pushActivity("chronos", "Published the next deadline", "Lock one user + painful moment · Today at 18:00", "complete")}><CalendarClock size={16} /> Publish next deadline</button>
          </div>
          <div className="countdown-card"><span className="section-kicker">Submission window</span><div className="countdown">48<span>h</span> 12<span>m</span></div><p>until the demo cut-off</p><div className="progress-line"><span /></div><div className="countdown-foot"><span>1 / 4 milestones complete</span><span className="mono">42%</span></div></div>
        </div>
      );
    }

    if (activeAgent === "zeus") {
      return (
        <div className="room-body split-room">
          <div className="room-column">
            <div className="section-kicker"><span className="kicker-dot violet" /> Orchestration map</div>
            <h3>The constellation has a next move.</h3>
            <p className="room-intro">Zeus holds the thread between rooms. He does not answer for the specialists; he makes their context portable.</p>
            <div className="route-map"><div className="route-node done"><span>01</span><b>Hermes</b><small>context captured</small></div><div className="route-connector active" /><div className="route-node active"><span>02</span><b>RAG</b><small>retrieve evidence</small></div><div className="route-connector" /><div className="route-node"><span>03</span><b>Athena</b><small>pressure-test idea</small></div><div className="route-connector" /><div className="route-node"><span>04</span><b>Hephaestus</b><small>make it buildable</small></div></div>
            <div className="handoff-strip"><Inbox size={14} /><span><b>Carrying forward:</b> {uncertainty}</span></div>
          </div>
          <div className="orchestration-card"><Network size={20} /><span className="section-kicker">Signal integrity</span><strong>3 handoffs visible</strong><p>Each room can inspect the prior room&apos;s context. No agent is a black box in this demo.</p><div className="integration-pill mocked">MCP / model calls · unavailable</div></div>
        </div>
      );
    }

    return (
      <div className="room-body split-room">
        <div className="room-column">
          <div className="section-kicker"><span className="kicker-dot blue" /> Hermes intake</div>
          <h3>Give the constellation something real to carry.</h3>
          <p className="room-intro">Start with the shape of the problem. Hermes will turn it into a handoff, not a generic welcome message.</p>
          <div className="field-grid"><label><span>What are you building?</span><input value={challenge} onChange={event => setChallenge(event.target.value)} /></label><label><span>Event / moment</span><input value={event} onChange={event => setEvent(event.target.value)} /></label><label><span>Team + time</span><input value={team} onChange={event => setTeam(event.target.value)} /></label><label className="full-field"><span>Main uncertainty</span><textarea value={uncertainty} onChange={event => setUncertainty(event.target.value)} rows={2} /></label></div>
          <button className="primary-button" onClick={completeOnboarding}><Play size={16} /> {onboardingComplete ? "Re-route the mission" : "Create handoff"}</button>
        </div>
        <div className="mission-card"><div className="mission-orbit"><span>H</span></div><div><span className="section-kicker">{onboardingComplete ? "handoff created" : "waiting for context"}</span><h3>{onboardingComplete ? "Zeus is carrying your brief." : "Hermes is listening."}</h3><p>{onboardingComplete ? `Next: retrieve evidence for “${challenge}” before Athena recommends a direction.` : "Tell Hermes where you are stuck; the constellation will route the next useful move."}</p></div><div className="mission-metrics"><span><b>{onboardingComplete ? "04" : "00"}</b> fields captured</span><span><b>{readyCount}</b> cited sources ready</span></div></div>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <div className="storm-noise" />
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-sigil">✦</div><div><div className="brand-wordmark">GUIDA<span>THON</span></div><div className="brand-subtitle">evidence / action / outcome</div></div></div>
        <div className="topbar-status"><span className="status-dot live" /> constellation online <span className="status-divider" /> <span className="mono">LOCAL DEMO / v0.3</span></div>
        <button className="help-button" aria-label="Help"><CircleHelp size={17} /></button>
      </header>
      <div className="workspace-shell">
        <aside className="line-sidebar">
          <div className="sidebar-caption">workspace</div>
          <nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activeNav === id ? "active" : ""}`} onClick={() => switchNav(id)}><span className="nav-line" /><Icon size={15} /><span>{label}</span>{id === "Sources" && <em>{allChunks.length}</em>}</button>)}</nav>
          <div className="sidebar-bottom"><div className="agent-mini"><div className="mini-avatar hermes">H</div><div><b>Hermes</b><span>guide room</span></div><span className="online-dot" /></div><button className="settings-link" onClick={() => switchNav("Settings")}><Settings2 size={14} /> Workspace settings</button></div>
        </aside>
        <main className="workspace-main">
          <div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> {activeNav === "Overview" ? "GUIDED JOURNEY / 01" : `WORKSPACE / ${activeNav.toUpperCase()}`}</div><h1>{activeNav === "Overview" ? "From uncertainty to a defensible build." : activeNav}</h1><p>{activeNav === "Overview" ? "A visible multi-agent path for teams who need to prove the next move, not just brainstorm it." : `The ${activeNav.toLowerCase()} room stays connected to your latest handoff.`}</p></div><div className="heading-actions"><span className="integration-pill unverified"><span className="status-dot" /> MCP bridge unverified</span><button className="icon-button"><MessageSquareText size={16} /></button></div></div>
          <section className="agent-constellation"><div className="section-title-row"><div><div className="eyebrow small"><span className="eyebrow-line" /> agent constellation</div><h2>Choose your next room</h2></div><span className="mono constellation-count">{agents.length} spirits · 01 active</span></div><div className="agent-rail">{agents.map(agent => <button key={agent.id} className={`agent-tile ${activeAgent === agent.id ? "selected" : ""} accent-${agent.accent}`} onClick={() => selectAgent(agent.id)}><div className="agent-avatar"><span>{agent.glyph}</span><i /></div><div className="agent-tile-copy"><b>{agent.name}</b><span>{agent.role}</span></div><ChevronRight className="tile-arrow" size={15} /></button>)}</div></section>
          <section className="room-panel"><div className="room-panel-top"><div className="room-title"><div className={`room-avatar accent-${selected.accent}`}>{selected.glyph}</div><div><div className="eyebrow small">current room / {selected.role.toLowerCase()}</div><h2>{selected.name}<span> · {selected.short}</span></h2></div></div><div className="room-state"><span className="status-dot live" /> working context <span className="mono">HND-{onboardingComplete ? "042" : "001"}</span></div></div><div className="handoff-banner"><ArrowUpRight size={14} /><span><b>Latest handoff</b> {onboardingComplete ? `${event} · ${team} · ${uncertainty}` : "No handoff yet. Hermes is waiting for your first brief."}</span><button onClick={() => setActiveAgent("zeus")}>inspect thread <ChevronRight size={13} /></button></div>{renderRoom()}</section>
          <section className="bottom-grid"><div className="activity-panel"><div className="panel-heading"><div><div className="eyebrow small"><span className="eyebrow-line" /> trace log</div><h3>What the constellation is doing</h3></div><span className="mono">LIVE</span></div><div className="activity-list">{activities.map(activity => { const agent = agentById(activity.agent); return <div className="activity-row" key={activity.id}><div className={`activity-icon accent-${agent.accent}`}>{agent.glyph}</div><div className="activity-copy"><div><b>{agent.name}</b><span>{activity.action}</span></div><p>{activity.detail}</p></div><div className={`activity-state ${activity.state}`}><span className="status-dot" />{activity.time}</div></div>; })}</div></div><div className="readiness-panel"><div className="panel-heading"><div><div className="eyebrow small"><span className="eyebrow-line" /> build signal</div><h3>Submission readiness</h3></div><span className="readiness-score">42%</span></div><div className="readiness-bar"><span /></div><div className="readiness-items"><span><Check size={13} /> evidence loop</span><span><Timer size={13} /> deadline mapped</span><span className="pending"><span className="pending-dot" /> demo proof missing</span></div><button className="text-button" onClick={() => switchNav("Submission Readiness")}>Open readiness room <ArrowUpRight size={14} /></button></div></section>
        </main>
      </div>
      <input ref={fileInputRef} type="file" className="hidden-file-input" onChange={handleFile} accept=".txt,.md,.csv,.json,text/*,.pdf" />
    </div>
  );
}

function SourceIntake({ sources, manualNote, setManualNote, addManualNote, onUpload, uploadedName }: { sources: SourceRecord[]; manualNote: string; setManualNote: (value: string) => void; addManualNote: () => void; onUpload: () => void; uploadedName: string }) {
  return (
    <aside className="source-intake"><div className="section-kicker"><span className="kicker-dot gold" /> Source intake</div><div className="upload-dropzone" onClick={onUpload}><UploadCloud size={19} /><b>{uploadedName || "Drop a brief or upload a file"}</b><span>Text files are parsed locally · other types remain unverified</span><button className="upload-button" onClick={event => { event.stopPropagation(); onUpload(); }}><Paperclip size={14} /> choose file</button></div><div className="manual-note"><div className="manual-heading"><span>or add a manual note</span><span className="mono">UNVERIFIED → PROCESSED</span></div><textarea value={manualNote} onChange={event => setManualNote(event.target.value)} placeholder="Paste a problem statement, judging rubric, or mentor note…" rows={4} /><button className="small-action" onClick={addManualNote} disabled={!manualNote.trim()}><Plus size={14} /> queue note</button></div><div className="source-list"><div className="source-list-heading"><span>Corpus status</span><span className="mono">{sources.length} records</span></div>{sources.slice(0, 4).map(source => <div className="source-row" key={source.id}><div className={`source-icon ${source.status}`}><FileText size={14} /></div><div><b>{source.name}</b><span>{source.detail}</span></div><span className={`source-status ${source.status}`}>{source.status === "verified" ? "READY" : source.status === "processing" ? "PARSE" : "NEW"}</span></div>)}</div><div className="intake-note"><CircleHelp size={13} /><span>Only <b>verified</b> sources enter retrieval. Nothing is silently promoted.</span></div></aside>
  );
}
