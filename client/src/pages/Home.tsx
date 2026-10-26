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
  Settings2,
  Sparkles,
  Target,
  Timer,
  UploadCloud,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { ChangeEvent, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

type AgentId = "hermes" | "zeus" | "athena" | "hephaestus" | "chronos";
type NavId =
  | "Overview"
  | "Agents"
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
  { id: "hermes", name: "Hermes", role: "Guide + knowledge", short: "Answers, frames, routes", glyph: "✦", accent: "blue" },
  { id: "zeus", name: "Zeus", role: "Orchestrator", short: "Routes the next move", glyph: "ϟ", accent: "violet" },
  { id: "athena", name: "Athena", role: "Idea analysis", short: "Tests the thesis", glyph: "Δ", accent: "rose" },
  { id: "hephaestus", name: "Hephaestus", role: "Stack + workflow", short: "Turns plans buildable", glyph: "⌘", accent: "orange" },
  { id: "chronos", name: "Chronos", role: "Time + submission", short: "Makes time visible", glyph: "◷", accent: "teal" },
];

const navItems: Array<{ id: NavId; label: string; icon: typeof Radar }> = [
  { id: "Overview", label: "Overview", icon: Radar },
  { id: "Agents", label: "Constellations", icon: Bot },
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
    id: "chunk://devpost-judging/001",
    source: "Devpost · Step 8: Setting up judging",
    heading: "Judging mode shapes the review workflow",
    passage: "Devpost distinguishes offline judging, where projects can be reviewed through expos, demos, or presentations, from online judging, where judges log in and review projects using the criteria set by the organizer.",
    provenance: "public source · https://help.devpost.com/article/131-setting-up-judging · updated 2026-09-14",
  },
  {
    id: "chunk://devpost-judging/002",
    source: "Devpost · Step 8: Setting up judging",
    heading: "Criteria, comments, and review states are explicit",
    passage: "Online judging uses organizer-defined criteria to rate projects on a 1–5 scale. Organizers can enable judge comments, and judging cannot start until submissions are marked Judge or Do not Judge; an admin starts and finishes the process.",
    provenance: "public source · https://help.devpost.com/article/131-setting-up-judging · updated 2026-09-14",
  },
  {
    id: "chunk://mlh-member-events/001",
    source: "MLH · Member Event Guidelines",
    heading: "A typical supported event is time-boxed",
    passage: "MLH member events are described as 24 to 48 hours long and usually run over a weekend. Judging and prizes are expected at the end of the hackathon on Sunday unless the organizer discusses a post-event plan.",
    provenance: "public source · https://github.com/MLH/mlh-policies/blob/main/member-event-guidelines.md · 2027 season",
  },
  {
    id: "chunk://mlh-member-events/002",
    source: "MLH · Member Event Guidelines",
    heading: "Access and AI policy are part of the event contract",
    passage: "The current MLH member-event guidance emphasizes free attendance, student participation requirements, no early elimination rounds, and allowing hackers to use generative AI and LLMs.",
    provenance: "public source · https://github.com/MLH/mlh-policies/blob/main/member-event-guidelines.md · 2027 season",
  },
];

const initialSources: SourceRecord[] = [
  {
    id: "src-brief",
    name: "devpost-judging.md",
    kind: "fixture",
    status: "verified",
    chunks: seedChunks.slice(0, 2),
    detail: "Public source · cited and ready",
  },
  {
    id: "src-notes",
    name: "mlh-member-events.md",
    kind: "fixture",
    status: "verified",
    chunks: seedChunks.slice(2),
    detail: "Public source · cited and ready",
  },
];

const initialActivity: Activity[] = [
  { id: "a1", agent: "hermes", action: "Opened the constellation", detail: "Waiting for your challenge context.", time: "now", state: "live" },
  { id: "a2", agent: "hermes", action: "Loaded public starter corpus", detail: "4 cited chunks from Devpost + MLH are ready for Hermes.", time: "09:41", state: "complete" },
  { id: "a3", agent: "zeus", action: "Integration check", detail: "Hermes server model is active; optional MCP tools are not configured.", time: "09:40", state: "queued" },
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

function playSparkSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const rumble = context.createOscillator();
    const rumbleGain = context.createGain();
    rumble.type = "sine";
    rumble.frequency.setValueAtTime(78, context.currentTime);
    rumble.frequency.exponentialRampToValueAtTime(42, context.currentTime + 0.42);
    rumbleGain.gain.setValueAtTime(0.0001, context.currentTime);
    rumbleGain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.018);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.48);
    const noise = context.createBufferSource();
    const buffer = context.createBuffer(1, context.sampleRate * 0.25, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
    noise.buffer = buffer;
    const filter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(240, context.currentTime + 0.2);
    noiseGain.gain.setValueAtTime(0.0001, context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.006);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
    rumble.connect(rumbleGain).connect(context.destination);
    noise.connect(filter).connect(noiseGain).connect(context.destination);
    rumble.start(); noise.start();
    rumble.stop(context.currentTime + 0.5); noise.stop(context.currentTime + 0.26);
    rumble.addEventListener("ended", () => void context.close());
  } catch {
    // Audio is an enhancement; blocked audio must never block the interface.
  }
}

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [activeNav, setActiveNav] = useState<NavId>("Overview");
  const [activeAgent, setActiveAgent] = useState<AgentId>("hermes");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [challenge, setChallenge] = useState("Build a trustworthy AI mentor for hackathon teams");
  const [event, setEvent] = useState("Guidathon 2026");
  const [team, setTeam] = useState("3 builders · 48 hours");
  const [uncertainty, setUncertainty] = useState("Which idea is narrow enough to ship and strong enough to demo?");
  const [hermesInput, setHermesInput] = useState("");
  const [hermesMessages, setHermesMessages] = useState<Array<{ role: "user" | "assistant"; content: string; citations?: string[] }>>([]);
  const [sources, setSources] = useState<SourceRecord[]>(initialSources);
  const [activities, setActivities] = useState<Activity[]>(initialActivity);
  const [retrieval, setRetrieval] = useState<Chunk[]>([]);
  const [manualNote, setManualNote] = useState("");
  const [ideaRun, setIdeaRun] = useState(false);
  const [stackRun, setStackRun] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [hoveringInteractive, setHoveringInteractive] = useState(false);
  const [trail, setTrail] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [clickSpark, setClickSpark] = useState<{ id: number; x: number; y: number } | null>(null);
  const [handoff, setHandoff] = useState<{ from: string; to: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hermesAsk = trpc.hermes.ask.useMutation();

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      setCursor({ x: event.clientX, y: event.clientY });
      setTrail(current => [...current.slice(-13), { id: Date.now() + Math.random(), x: event.clientX, y: event.clientY }]);
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    const handleOver = (event: MouseEvent) => setHoveringInteractive(Boolean((event.target as HTMLElement).closest("button, a, input, textarea, [role=button]")));
    window.addEventListener("mouseover", handleOver, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
    };
  }, []);

  const allChunks = useMemo(() => sources.filter(source => source.status === "verified").flatMap(source => source.chunks), [sources]);
  const selected = agentById(activeAgent);
  const readyCount = sources.filter(source => source.status === "verified").length;
  const activeNavAgent: Partial<Record<NavId, AgentId>> = {
    Sources: "hermes",
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
    const nextAgent = agentById(id);
    setHandoff({ from: selected.name, to: nextAgent.name });
    setActiveAgent(id);
    pushActivity("zeus", `Routed context to ${nextAgent.name}`, `${selected.name} → ${nextAgent.name}: ${uncertainty || "open question"}`, "live");
    window.setTimeout(() => setHandoff(null), 1100);
  };

  const triggerClickSpark = (event: React.PointerEvent<HTMLDivElement>) => {
    const nextSpark = { id: Date.now(), x: event.clientX, y: event.clientY };
    setClickSpark(nextSpark);
    playSparkSound();
    window.setTimeout(() => setClickSpark(current => current?.id === nextSpark.id ? null : current), 620);
  };

  const enterWorkspace = () => {
    setEntered(true);
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    setActiveAgent("athena");
    pushActivity("hermes", "Created the mission handoff", `${event} · ${team} · uncertainty captured`, "complete");
    pushActivity("hermes", "Handed the brief to Athena", "Idea pressure-testing is next; the original brief stays attached.", "live");
  };

  const fallbackHermesAnswer = (question: string, ranked: Chunk[]) => {
    if (!ranked.length) return `I could not ground “${question}” in the current source pack. Add a brief, judging rubric, or event guide in the intake panel and I will use it in the next answer.`;
    return `Here is the grounded answer from the current source pack:\n\n${ranked.map(chunk => `• ${chunk.passage} [${chunk.id}]`).join("\n\n")}\n\nNext move: turn the relevant point into one decision your team can test this cycle.`;
  };

  const askHermes = () => {
    const question = hermesInput.trim();
    if (!question || hermesAsk.isPending) return;
    const ranked = allChunks
      .map(chunk => ({ ...chunk, score: scorePassage(question, `${chunk.heading} ${chunk.passage}`) }))
      .filter(chunk => (chunk.score ?? 0) > 0.44)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
    setRetrieval(ranked);
    setHermesMessages(current => [...current, { role: "user", content: question }]);
    setHermesInput("");
    pushActivity("hermes", "Retrieved source chunks", ranked.length ? `${ranked.length} chunks attached to the model request.` : "No matching chunk; Hermes will label the answer as general guidance.", "live");
    hermesAsk.mutate({
      question,
      context: ranked,
      history: hermesMessages.slice(-6).map(message => ({ role: message.role, content: message.content })),
    }, {
      onSuccess: result => {
        setHermesMessages(current => [...current, { role: "assistant", content: result.answer, citations: result.citations }]);
        pushActivity("hermes", "Answered with model support", `${result.citations.length} source IDs were available to the response.`, "complete");
      },
      onError: () => {
        const answer = fallbackHermesAnswer(question, ranked);
        setHermesMessages(current => [...current, { role: "assistant", content: answer, citations: ranked.map(chunk => chunk.id) }]);
        pushActivity("hermes", "Returned a transparent fallback", "The server model route was unavailable; local evidence remains visible.", "complete");
      },
    });
  };

  const addSource = (record: SourceRecord) => {
    setSources(current => [record, ...current]);
    window.setTimeout(() => {
      setSources(current => current.map(source => source.id === record.id ? { ...source, status: "verified", detail: `${record.chunks.length} chunks · local parse complete` } : source));
      pushActivity("hermes", "Processed a new source", `${record.name} is now searchable but still locally verified only.`, "complete");
    }, 760);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedName(file.name);
    const isText = file.type.startsWith("text/") || /\.(md|txt|csv|json|html|css|js|jsx|ts|tsx|py|java|go|rs|yaml|yml)$/i.test(file.name);
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
    pushActivity("hermes", "Accepted an upload", `${file.name} entered intake as unverified.`, "live");
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
    pushActivity("hermes", "Accepted a manual note", "The note is being chunked before it can influence answers.", "live");
  };

  const switchNav = (id: NavId) => {
    setActiveNav(id);
    const mappedAgent = activeNavAgent[id];
    if (mappedAgent) setActiveAgent(mappedAgent);
  };

  const renderRoom = () => {
    if (activeNav === "Agents") {
      return (
        <div className="agents-room-body">
          <div className="agents-room-copy">
            <div className="section-kicker"><span className="kicker-dot gold" /> The constellation room</div>
            <h3>{agents.length} spirits. One shared thread.</h3>
            <p className="room-intro">Spin through the rooms and feel the handoff path. Every spirit has a bounded role, a distinct signal, and a concrete artifact to return.</p>
            <div className="agent-room-legend">{agents.map(agent => <button key={agent.id} className={`legend-agent ${activeAgent === agent.id ? "active" : ""}`} onClick={() => selectAgent(agent.id)}><span className={`legend-dot accent-${agent.accent}`} /> {agent.name}<small>{agent.role}</small></button>)}</div>
            <div className="handoff-strip"><Network size={14} /><span><b>Current thread:</b> {onboardingComplete ? `${event} → Hermes → Athena → build` : "Hermes is waiting for the first brief."}</span></div>
            <AgentRoleChat agent={selected} />
          </div>
          <div className="agent-orbit" aria-label="Circular agent carousel">
            <div className="orbit-glow" />
            <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
            <div className={`orbit-core accent-${selected.accent}`}><span>{selected.glyph}</span><b>{selected.name}</b><small>{selected.role}</small></div>
            {agents.map((agent, index) => {
              const angle = (index / agents.length) * 360 - 90;
              return <button key={agent.id} className={`orbit-agent ${activeAgent === agent.id ? "active" : ""}`} style={{ "--angle": `${angle}deg` } as CSSProperties} onClick={() => selectAgent(agent.id)}><span className={`orbit-agent-avatar accent-${agent.accent}`}>{agent.glyph}</span><b>{agent.name}</b></button>;
            })}
          </div>
        </div>
      );
    }
    if (activeAgent === "hermes") {
      return (
        <div className="room-body hermes-room">
          <div className="hermes-chat room-column">
            <div className="section-kicker"><span className="kicker-dot blue" /> Hermes knowledge room</div>
            <h3>Ask the guide anything about hackathons.</h3>
            <p className="room-intro">Hermes combines a model-backed answer with the visible source chunks below. Ask about rules, judging, scope, teams, demos, or what to build next.</p>
            <div className="hermes-transcript">
              <div className="chat-bubble assistant"><div className="chat-speaker"><span className="chat-avatar">✦</span><b>Hermes</b><span>guide + knowledge</span></div><p>Ask me what a hackathon is, how judging works, or how to turn your idea into a weekend-sized build. I will separate cited facts from general guidance.</p></div>
              {hermesMessages.map((message, index) => <div className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}><div className="chat-speaker"><span className="chat-avatar">{message.role === "assistant" ? "✦" : "you"}</span><b>{message.role === "assistant" ? "Hermes" : "You"}</b></div><p>{message.content}</p>{message.citations?.length ? <div className="chat-citations">{message.citations.map(citation => <span key={citation}>{citation}</span>)}</div> : null}</div>)}
              {hermesAsk.isPending && <div className="chat-bubble assistant thinking"><div className="chat-speaker"><span className="chat-avatar">✦</span><b>Hermes</b><span>retrieving + thinking</span></div><p><span className="thinking-dot" /> <span className="thinking-dot" /> <span className="thinking-dot" /> I&apos;m checking the source pack and composing a precise answer…</p></div>}
            </div>
            <div className="hermes-composer"><textarea value={hermesInput} onChange={event => setHermesInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); askHermes(); } }} placeholder="e.g. What makes a hackathon idea defensible?" rows={2} /><button className="primary-button" onClick={askHermes} disabled={hermesAsk.isPending || !hermesInput.trim()}>{hermesAsk.isPending ? "Hermes is thinking" : "Ask Hermes"}<ArrowUpRight size={15} /></button></div>
            <div className="retrieval-state"><span className="status-dot live" /> Hermes model route · {readyCount} verified sources · {allChunks.length} chunks · Enter to send</div>
            {retrieval.length > 0 && <div className="retrieval-results hermes-evidence"><div className="result-heading"><span>Evidence attached to latest answer</span><span className="mono">{retrieval.length} matches</span></div>{retrieval.map(chunk => <div className="chunk-card" key={chunk.id}><div className="chunk-meta"><span className="mono chunk-id">{chunk.id}</span><span className="score">match {Math.round((chunk.score ?? 0) * 100)}%</span></div><h4>{chunk.heading}</h4><p>{chunk.passage}</p><div className="chunk-source"><Link2 size={12} /> {chunk.source} · {chunk.provenance}</div></div>)}</div>}
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
              <div className="hypothesis"><div className="hypothesis-top"><span className="hypothesis-index">03</span><span className="muted-label">safe bet</span></div><h4>Hermes answer desk</h4><p>Answer event questions with citations, but underplays the agent handoff story.</p><div className="hypothesis-foot"><span>Impact <b>medium</b></span><span>Scope <b>focused</b></span><span>Proof <b>clear</b></span></div></div>
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
              {[['React + Vite', 'Fast local workspace with transparent state.'], ['TypeScript', 'Keeps agent contracts and chunk metadata explicit.'], ['Local retrieval → vector store', 'Start with visible chunk scoring; swap in embeddings when the corpus grows.'], ['MCP adapter', 'One boundary for tools, source ingestion, and future model calls.']].map(([name, detail], index) => <div className="stack-row" key={name}><span className="stack-number">0{index + 1}</span><div><b>{name}</b><p>{detail}</p></div><span className="stack-state">{index === 2 ? "NEXT" : "READY"}</span></div>)}
            </div>
            <button className="primary-button" onClick={() => { setStackRun(true); pushActivity("hephaestus", "Proposed the build stack", "React + TypeScript + Hermes retrieval now; MCP + vector store next.", "complete"); }}><Zap size={16} /> {stackRun ? "Stack staged" : "Stage technical plan"}</button>
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
            <div className="route-map"><div className="route-node done"><span>01</span><b>Hermes</b><small>context captured</small></div><div className="route-connector active" /><div className="route-node active"><span>02</span><b>Hermes model</b><small>answer + evidence</small></div><div className="route-connector" /><div className="route-node"><span>03</span><b>Athena</b><small>pressure-test idea</small></div><div className="route-connector" /><div className="route-node"><span>04</span><b>Hephaestus</b><small>make it buildable</small></div></div>
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
    <div className={`app-shell ${entered ? "has-entered" : "is-landing"}`} onPointerDown={triggerClickSpark}>
      <video className="storm-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true"><source src="/media/guidathon-storm-loop.mp4" type="video/mp4" /></video>
      <div className="cursor-trail" aria-hidden="true">{trail.map(point => <span key={point.id} style={{ left: point.x, top: point.y }} />)}<span className={`thunder-cursor ${hoveringInteractive ? "hidden" : ""}`} style={{ left: cursor.x, top: cursor.y }}>ϟ</span>{clickSpark && <span className="click-spark" style={{ left: clickSpark.x, top: clickSpark.y }}>✦</span>}</div>
      <div className="storm-noise" />
      {handoff && <div className="handoff-transition" aria-live="polite"><div className="cloud-curtain cloud-left" /><div className="cloud-curtain cloud-right" /><div className="handoff-transition-copy"><span className="mono">CONTEXT IN MOTION</span><strong>{handoff.from} <i>→</i> {handoff.to}</strong><small>carrying the latest brief forward</small></div></div>}
      <section className={`landing-screen ${entered ? "landing-exit" : ""}`} onClick={enterWorkspace}>
        <div className="landing-veil" />
        <div className="landing-content"><div className="landing-sigil">✦</div><div className="landing-wordmark">GUIDA<span>THON</span></div><div className="landing-lockup">evidence / action / outcome</div><div className="landing-reveal-title">The constellation is ready.</div></div>
        <button className="landing-cue" onClick={event => { event.stopPropagation(); enterWorkspace(); }}><span className="cue-pulse" /> click anywhere to begin</button>
      </section>
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
          <div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> {activeNav === "Overview" ? "GUIDED JOURNEY / 01" : `WORKSPACE / ${activeNav.toUpperCase()}`}</div><h1>{activeNav === "Overview" ? "From uncertainty to a defensible build." : activeNav === "Agents" ? "Constellations" : activeNav}</h1><p>{activeNav === "Overview" ? "A visible multi-agent path for teams who need to prove the next move, not just brainstorm it." : `The ${activeNav === "Agents" ? "constellation" : activeNav.toLowerCase()} room stays connected to your latest handoff.`}</p></div><div className="heading-actions"><span className="integration-pill unverified"><span className="status-dot live" /> Hermes model active · MCP optional</span><button className="icon-button"><MessageSquareText size={16} /></button></div></div>
          <section className="agent-constellation"><div className="section-title-row"><div><div className="eyebrow small"><span className="eyebrow-line" /> agent constellation</div><h2>Choose your next room</h2></div><span className="mono constellation-count">{agents.length} spirits · 01 active</span></div><div className="agent-rail">{agents.map(agent => <button key={agent.id} className={`agent-tile ${activeAgent === agent.id ? "selected" : ""} accent-${agent.accent}`} onClick={() => selectAgent(agent.id)}><div className="agent-avatar"><span>{agent.glyph}</span><i /></div><div className="agent-tile-copy"><b>{agent.name}</b><span>{agent.role}</span></div></button>)}</div></section>
          <section className="room-panel"><div className="room-panel-top"><div className="room-title"><div className={`room-avatar accent-${selected.accent}`}>{selected.glyph}</div><div><div className="eyebrow small">current room / {selected.role.toLowerCase()}</div><h2>{selected.name}<span> · {selected.short}</span></h2></div></div><div className="room-state"><span className="status-dot live" /> working context <span className="mono">HND-{onboardingComplete ? "042" : "001"}</span></div></div><div className="handoff-banner"><ArrowUpRight size={14} /><span><b>Latest handoff</b> {onboardingComplete ? `${event} · ${team} · ${uncertainty}` : "No handoff yet. Hermes is waiting for your first brief."}</span><button onClick={() => setActiveAgent("zeus")}>inspect thread <ChevronRight size={13} /></button></div>{renderRoom()}</section>
          <section className="bottom-grid"><div className="activity-panel"><div className="panel-heading"><div><div className="eyebrow small"><span className="eyebrow-line" /> trace log</div><h3>What the constellation is doing</h3></div><span className="mono">LIVE</span></div><div className="activity-list">{activities.map(activity => { const agent = agentById(activity.agent); return <div className="activity-row" key={activity.id}><div className={`activity-icon accent-${agent.accent}`}>{agent.glyph}</div><div className="activity-copy"><div><b>{agent.name}</b><span>{activity.action}</span></div><p>{activity.detail}</p></div><div className={`activity-state ${activity.state}`}><span className="status-dot" />{activity.time}</div></div>; })}</div></div><div className="readiness-panel"><div className="panel-heading"><div><div className="eyebrow small"><span className="eyebrow-line" /> build signal</div><h3>Submission readiness</h3></div><span className="readiness-score">42%</span></div><div className="readiness-bar"><span /></div><div className="readiness-items"><span><Check size={13} /> evidence loop</span><span><Timer size={13} /> deadline mapped</span><span className="pending"><span className="pending-dot" /> demo proof missing</span></div><button className="text-button" onClick={() => switchNav("Submission Readiness")}>Open readiness room <ArrowUpRight size={14} /></button></div></section>
        </main>
      </div>
      <input ref={fileInputRef} type="file" className="hidden-file-input" onChange={handleFile} accept=".txt,.md,.csv,.json,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.yaml,.yml,text/*,.pdf" />
    </div>
  );
}

function SourceIntake({ sources, manualNote, setManualNote, addManualNote, onUpload, uploadedName }: { sources: SourceRecord[]; manualNote: string; setManualNote: (value: string) => void; addManualNote: () => void; onUpload: () => void; uploadedName: string }) {
  return (
    <aside className="source-intake"><div className="section-kicker"><span className="kicker-dot gold" /> Source intake</div><div className="upload-dropzone" onClick={onUpload}><UploadCloud size={19} /><b>{uploadedName || "Drop a brief or upload a file"}</b><span>Text files are parsed locally · other types remain unverified</span><button className="upload-button" onClick={event => { event.stopPropagation(); onUpload(); }}><Paperclip size={14} /> choose file</button></div><div className="manual-note"><div className="manual-heading"><span>or add a manual note</span><span className="mono">UNVERIFIED → PROCESSED</span></div><textarea value={manualNote} onChange={event => setManualNote(event.target.value)} placeholder="Paste a problem statement, judging rubric, or mentor note…" rows={4} /><button className="small-action" onClick={addManualNote} disabled={!manualNote.trim()}><Plus size={14} /> queue note</button></div><div className="source-list"><div className="source-list-heading"><span>Corpus status</span><span className="mono">{sources.length} records</span></div>{sources.slice(0, 4).map(source => <div className="source-row" key={source.id}><div className={`source-icon ${source.status}`}><FileText size={14} /></div><div><b>{source.name}</b><span>{source.detail}</span></div><span className={`source-status ${source.status}`}>{source.status === "verified" ? "READY" : source.status === "processing" ? "PARSE" : "NEW"}</span></div>)}</div><div className="intake-note"><CircleHelp size={13} /><span>Only <b>verified</b> sources enter retrieval. Nothing is silently promoted.</span></div></aside>
  );
}

function AgentRoleChat({ agent }: { agent: (typeof agents)[number] }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "agent"; text: string }>>([]);
  const roleAnswers: Record<AgentId, string> = {
    hermes: "I am Hermes, the guide and knowledge layer. Ask me about hackathon formats, judging, scoping, or what the current sources establish. I will keep facts, citations, and next actions distinct.",
    zeus: "I am Zeus, the orchestrator. I do not invent the specialist answer; I carry the brief between rooms, expose what is missing, and make the next handoff explicit.",
    athena: "I am Athena, the idea pressure tester. I compare hypotheses by user value, proof, and scope, then recommend the smallest idea worth testing.",
    hephaestus: "I am Hephaestus, the builder. I turn the selected direction into a practical stack, workflow, and integration boundary that can survive a demo.",
    chronos: "I am Chronos, the timekeeper. I turn the build into dated milestones, owners, and a submission sequence so the team can see what must happen next.",
  };

  const askRole = () => {
    const question = input.trim();
    if (!question) return;
    setMessages(current => [...current, { role: "user", text: question }, { role: "agent", text: `${roleAnswers[agent.id]}\n\nFor this role, your question points to: ${question}` }]);
    setInput("");
  };

  return (
    <div className={`role-chat accent-${agent.accent}`}>
      <div className="role-chat-head"><span className="section-kicker">{agent.name}&apos;s role chat</span><span className="mono">SCOPE LOCKED</span></div>
      <div className="role-chat-intro"><span className="role-chat-avatar">{agent.glyph}</span><p><b>{agent.name}:</b> {roleAnswers[agent.id]}</p></div>
      {messages.slice(-4).map((message, index) => <div className={`role-chat-line ${message.role}`} key={`${message.role}-${index}`}><b>{message.role === "agent" ? agent.name : "you"}</b><span>{message.text}</span></div>)}
      <div className="role-chat-input"><input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === "Enter" && askRole()} placeholder={`Ask ${agent.name} about their role…`} /><button onClick={askRole} aria-label={`Ask ${agent.name}`}><ArrowUpRight size={14} /></button></div>
    </div>
  );
}
