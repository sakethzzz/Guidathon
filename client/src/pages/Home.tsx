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
  Network,
  Paperclip,
  Play,
  Plus,
  Radar,
  Settings2,
  Sparkles,
  Sun,
  Moon,
  Target,
  Timer,
  UploadCloud,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { ChangeEvent, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type AgentId = "hermes" | "zeus" | "athena" | "hephaestus" | "chronos";
type NavId =
  | "Overview"
  | "Agents"
  | "Sources"
  | "Challenge Brief"
  | "Idea Lab"
  | "Technical Plan"
  | "Timeline & Tasks"
  | "Judge Arena"
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

function createAgentArt(glyph: string, base: string, accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><radialGradient id="a"><stop stop-color="${accent}" stop-opacity=".55"/><stop offset="1" stop-color="${base}" stop-opacity="0"/></radialGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="${base}"/></linearGradient></defs><rect width="240" height="240" rx="42" fill="${base}"/><circle cx="120" cy="108" r="104" fill="url(#a)"/><circle cx="120" cy="108" r="76" fill="none" stroke="${accent}" stroke-opacity=".38" stroke-width="1.5"/><circle cx="120" cy="108" r="62" fill="none" stroke="${accent}" stroke-opacity=".24" stroke-dasharray="3 8"/><path d="M120 24 133 92 201 108 133 124 120 192 107 124 39 108 107 92Z" fill="url(#b)" fill-opacity=".16" stroke="${accent}" stroke-opacity=".7"/><text x="120" y="137" text-anchor="middle" font-family="Georgia,serif" font-size="92" fill="#fff7e7">${glyph}</text><text x="120" y="220" text-anchor="middle" font-family="monospace" font-size="10" letter-spacing="4" fill="${accent}">GUIDATHON</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const agents: Array<{
  id: AgentId;
  name: string;
  role: string;
  short: string;
  glyph: string;
  accent: string;
  art: string;
  theme: string;
  quote: string;
}> = [
  { id: "hermes", name: "Hermes", role: "Guide + knowledge", short: "Answers, frames, routes", glyph: "✦", accent: "blue", art: createAgentArt("✦", "#10233a", "#83c5ff"), theme: "skyline blue", quote: "Ask the fog a better question." },
  { id: "zeus", name: "Zeus", role: "Orchestrator", short: "Routes the next move", glyph: "ϟ", accent: "violet", art: createAgentArt("ϟ", "#1b1738", "#b7a1ff"), theme: "storm violet", quote: "Every handoff needs a keeper." },
  { id: "athena", name: "Athena", role: "Lead strategist", short: "Shapes winning ideas", glyph: "Δ", accent: "rose", art: createAgentArt("Δ", "#351a2b", "#f4a6c6"), theme: "rose strategy", quote: "A sharp idea survives contact." },
  { id: "hephaestus", name: "Hephaestus", role: "Stack + workflow", short: "Turns plans buildable", glyph: "⌘", accent: "orange", art: createAgentArt("⌘", "#392014", "#ffb36c"), theme: "forge orange", quote: "Make the next build smaller." },
  { id: "chronos", name: "Chronos", role: "Time + submission", short: "Makes time visible", glyph: "◷", accent: "teal", art: createAgentArt("◷", "#102d29", "#74e5c1"), theme: "tide teal", quote: "A deadline is a shape, not a threat." },
];

const antigravityParticles = Array.from({ length: 64 }, (_, index) => ({
  id: index,
  left: `${(index * 37.7) % 100}%`,
  top: `${(index * 61.3 + 9) % 100}%`,
  size: `${2 + (index % 3)}px`,
  delay: `${-((index * 0.37) % 8)}s`,
  duration: `${6 + (index % 5)}s`,
}));

function AntigravityField({ cursor, spark }: { cursor: { x: number; y: number }; spark: { id: number; x: number; y: number } | null }) {
  return <div className="antigravity-field" aria-hidden="true">
    <div className="antigravity-cursor-ring" style={{ left: cursor.x, top: cursor.y }} />
    <div className="antigravity-cursor-core" style={{ left: cursor.x, top: cursor.y }}>✦</div>
    <div className="antigravity-particles">{antigravityParticles.map(particle => <i key={particle.id} style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size, animationDelay: particle.delay, animationDuration: particle.duration }} />)}</div>
    {spark && <div key={spark.id} className="antigravity-burst" style={{ left: spark.x, top: spark.y }}><span /><span /><span /><span /><span /><span /></div>}
  </div>;
}

type AgentRecord = (typeof agents)[number];

const navItems: Array<{ id: NavId; label: string; icon: typeof Radar }> = [
  { id: "Overview", label: "Overview", icon: Radar },
  { id: "Agents", label: "Constellations", icon: Bot },
  { id: "Sources", label: "Sources", icon: FileText },
  { id: "Challenge Brief", label: "Challenge Brief", icon: Target },
  { id: "Idea Lab", label: "Idea Lab", icon: Sparkles },
  { id: "Technical Plan", label: "Technical Plan", icon: GitBranch },
  { id: "Timeline & Tasks", label: "Timeline & Tasks", icon: CalendarClock },
  { id: "Judge Arena", label: "Judge Arena", icon: Target },
  { id: "Settings", label: "Settings", icon: Settings2 },
];

const agentRoomFor: Record<AgentId, NavId> = {
  hermes: "Sources",
  zeus: "Challenge Brief",
  athena: "Idea Lab",
  hephaestus: "Technical Plan",
  chronos: "Timeline & Tasks",
};

const agentLore: Record<AgentId, { epithet: string; myth: string; responsibility: string; handoff: string }> = {
  hermes: { epithet: "The messenger between worlds", myth: "In Greek myth, Hermes carries messages across boundaries. GUIDATHON gives him the evidence trail: sources, retrieval, citations, and clear uncertainty.", responsibility: "Research, source intake, retrieval-augmented answers, and evidence provenance.", handoff: "When evidence is ready, Hermes sends the brief to Zeus or Athena." },
  zeus: { epithet: "The keeper of the whole sky", myth: "Zeus governs the Olympian order. Here, he coordinates specialists, protects shared context, and makes every handoff explicit.", responsibility: "Orchestration, context routing, decision ownership, and handoff integrity.", handoff: "When a decision needs specialist work, Zeus routes it to the right spirit." },
  athena: { epithet: "Wisdom with a strategist's edge", myth: "Athena represents strategic wisdom. She challenges assumptions, compares options, and asks what evidence would prove an idea.", responsibility: "Idea validation, user pain, differentiation, feasibility, and proof experiments.", handoff: "A validated thesis moves to Hephaestus for an implementation plan." },
  hephaestus: { epithet: "The maker beneath the mountain", myth: "Hephaestus is the divine craftsperson. He turns ambitious concepts into systems that can actually be built and demonstrated.", responsibility: "Architecture, code strategy, data boundaries, integrations, and MCP tool design.", handoff: "A buildable plan moves to Chronos for milestones and delivery." },
  chronos: { epithet: "The force that gives time a shape", myth: "Chronos personifies time. GUIDATHON uses him to expose dependencies, deadlines, owners, and the final submission buffer.", responsibility: "Timeline, milestone sequencing, task ownership, risk buffers, and submission readiness.", handoff: "Chronos reports delivery risk to Zeus so the team can reroute early." },
};

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
  {
    id: "chunk://devpost-criteria/001",
    source: "Devpost · Judging and public voting",
    heading: "Common judging criteria combine idea, implementation, and impact",
    passage: "Devpost describes common hackathon criteria as quality of the idea, implementation quality, and potential impact. Criteria should mirror what organizers want projects to focus on; participants must check the actual event rubric because organizers can customize it.",
    provenance: "public source · https://help.devpost.com/article/64-judging-public-voting",
  },
  {
    id: "chunk://design-sprint/001",
    source: "Google Design Sprint Kit · Methodology",
    heading: "A focused validation loop moves from understanding to testing",
    passage: "The Design Sprint Kit describes six phases: Understand, Define, Sketch, Decide, Prototype, and Validate. A shorter workshop can be appropriate when time is tight, provided the team chooses methods that fit the goal and leaves a testable solution.",
    provenance: "public source · https://designsprintkit.withgoogle.com/methodology",
  },
  {
    id: "chunk://owasp-top10/001",
    source: "OWASP · Top 10 2025",
    heading: "Baseline web security risks must be checked before a demo",
    passage: "OWASP Top 10:2025 lists broken access control, security misconfiguration, software supply-chain failures, cryptographic failures, injection, insecure design, authentication failures, software or data integrity failures, security logging and alerting failures, and mishandling exceptional conditions. Treat this as an awareness checklist, not a substitute for a threat model or testing.",
    provenance: "public source · https://top10.owasp.org/2025/en/",
  },
  {
    id: "chunk://w3c-wcag/001",
    source: "W3C WAI · WCAG overview",
    heading: "Accessibility should be treated as a product requirement",
    passage: "W3C's Web Content Accessibility Guidelines are published as stable, referenceable standards. Teams should design and test for accessible interaction, keyboard operation, understandable content, and perceivable interface states rather than treating accessibility as a last-minute visual polish task.",
    provenance: "public source · https://www.w3.org/WAI/standards-guidelines/wcag/",
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
    chunks: seedChunks.slice(2, 4),
    detail: "Public source · cited and ready",
  },
  {
    id: "src-playbook",
    name: "validation-security-accessibility.md",
    kind: "fixture",
    status: "verified",
    chunks: seedChunks.slice(4),
    detail: "Google Design Sprint · OWASP · W3C · cited and ready",
  },
];

const initialActivity: Activity[] = [
  { id: "a1", agent: "hermes", action: "Opened the constellation", detail: "Waiting for your challenge context.", time: "now", state: "live" },
  { id: "a2", agent: "hermes", action: "Loaded public starter corpus", detail: "8 curated chunks from Devpost, MLH, Google Design Sprint, OWASP, and W3C are ready for Hermes.", time: "09:41", state: "complete" },
  { id: "a3", agent: "zeus", action: "Integration check", detail: "Model providers are checked when a request is sent; local retrieval fallback is available and optional MCP is unconfigured.", time: "09:40", state: "queued" },
];

const initialTasks: Task[] = [
  { title: "Lock one user + painful moment", date: "Today · 18:00", owner: "Athena", status: "next" },
  { title: "Prototype the evidence loop", date: "Tomorrow · 12:00", owner: "Hephaestus", status: "queued" },
  { title: "Run 3 user observations", date: "Wed · 16:00", owner: "Hermes", status: "queued" },
  { title: "Record the 90s demo", date: "Thu · 20:00", owner: "Zeus", status: "queued" },
];

const retrievalStopWords = new Set(["the","and","for","with","that","this","from","what","when","where","which","who","how","why","are","was","were","will","would","could","should","about","into","your","you","our","their","them","have","has","had","can","not","but","does","did","than","then","also","just","make","made"]);

function tokenize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(word => word.length > 1 && !retrievalStopWords.has(word));
}

function scorePassage(query: string, passage: string, corpusSize = 1, documentFrequency: Record<string, number> = {}) {
  const terms = tokenize(query);
  const words = tokenize(passage);
  if (!terms.length || !words.length) return 0;
  const frequencies = new Map<string, number>();
  words.forEach(word => frequencies.set(word, (frequencies.get(word) ?? 0) + 1));
  const uniqueTerms = [...new Set(terms)];
  const lengthNorm = Math.sqrt(Math.max(1, words.length) / 120);
  let score = 0;
  for (const term of uniqueTerms) {
    const tf = frequencies.get(term) ?? 0;
    if (!tf) continue;
    const idf = Math.log(1 + (corpusSize - (documentFrequency[term] ?? 0) + 0.5) / ((documentFrequency[term] ?? 0) + 0.5));
    score += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * lengthNorm));
    if (passage.toLowerCase().includes(query.toLowerCase())) score += 1.1;
  }
  const coverage = uniqueTerms.filter(term => frequencies.has(term)).length / uniqueTerms.length;
  return Math.min(0.99, (score / Math.max(1, uniqueTerms.length * 1.7)) * 0.72 + coverage * 0.28);
}

function sourceUrlFromProvenance(provenance: string) {
  return provenance.match(/https?:\/\/[^\s)]+/)?.[0] ?? null;
}

function splitIntoChunks(text: string, source: string, prefix: string): Chunk[] {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim().slice(0, 90000);
  if (!normalized) return [];
  const passages: string[] = [];
  const targetSize = 1500;
  const overlap = 180;
  let start = 0;
  while (start < normalized.length && passages.length < 50) {
    let end = Math.min(normalized.length, start + targetSize);
    if (end < normalized.length) {
      const boundary = Math.max(
        normalized.lastIndexOf(". ", end),
        normalized.lastIndexOf("? ", end),
        normalized.lastIndexOf("! ", end),
        normalized.lastIndexOf("\n", end),
      );
      if (boundary > start + 900) end = boundary + 1;
    }
    const passage = normalized.slice(start, end).trim();
    if (passage) passages.push(passage);
    if (end >= normalized.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return passages.map((passage, index) => ({
    id: `chunk://${prefix}/${String(index + 1).padStart(3, "0")}`,
    source,
    heading: index === 0 ? "User-provided context" : `Context passage ${index + 1}`,
    passage,
    provenance: "user-provided text · parsed in browser · not independently fact-checked",
  }));
}

function agentById(id: AgentId) {
  return agents.find(agent => agent.id === id) ?? agents[0];
}

function playThunderRumble() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(58, now);
    oscillator.frequency.exponentialRampToValueAtTime(34, now + 1.05);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 1.2);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Audio may be blocked until a user gesture; the visual storm remains usable.
  }
}

function ShaderConstellation({ pointer }: { pointer: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef(pointer);
  pointerRef.current = pointer;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch { return; }
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
      fragmentShader: `uniform float uTime; uniform vec2 uPointer; varying vec2 vUv; void main(){ vec2 p=vUv-.5; p.x*=1.2; float d=length(p); float pulse=.5+.5*sin(uTime*.65+d*14.0); float halo=smoothstep(.54,.08,d)*(0.18+0.12*pulse); float flare=smoothstep(.12,.0,length(p-uPointer*.18))*.22; vec3 blue=vec3(.15,.48,.95); vec3 gold=vec3(.91,.72,.28); vec3 col=mix(blue,gold,smoothstep(.45,.0,d)); gl_FragColor=vec4(col,halo+flare); }`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);
    const resize = () => { const rect = canvas.getBoundingClientRect(); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25)); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); };
    resize();
    window.addEventListener("resize", resize);
    let frame = 0;
    let lastFrame = 0;
    const render = (time: number) => { frame = requestAnimationFrame(render); if (time - lastFrame < 33) return; lastFrame = time; material.uniforms.uTime.value = time * 0.001; material.uniforms.uPointer.value.set(pointerRef.current.x, pointerRef.current.y); renderer.render(scene, camera); };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); material.dispose(); mesh.geometry.dispose(); renderer.dispose(); };
  }, []);

  return <canvas ref={canvasRef} className="shader-constellation" aria-hidden="true" />;
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("Team");
  const [newTaskDate, setNewTaskDate] = useState("Before submission");
  const [retrieval, setRetrieval] = useState<Chunk[]>([]);
  const [manualNote, setManualNote] = useState("");
  const [ideaRun, setIdeaRun] = useState(false);
  const [stackRun, setStackRun] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => { try { const saved = localStorage.getItem("guidathon-theme"); return saved === "dark" || saved === "light" ? saved : "dark"; } catch { return "dark"; } });
  const [goldFlakes, setGoldFlakes] = useState<boolean>(() => { try { return localStorage.getItem("guidathon-gold-flakes") !== "off"; } catch { return true; } });
  const [aboutOpen, setAboutOpen] = useState(false);
  const [ideaInput, setIdeaInput] = useState("");
  const [ideaResponse, setIdeaResponse] = useState("");
  const [submissionInput, setSubmissionInput] = useState("");
  const [submissionResult, setSubmissionResult] = useState("");
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [clickSpark, setClickSpark] = useState<{ id: number; x: number; y: number } | null>(null);
  const [handoff, setHandoff] = useState<{ from: string; to: string } | null>(null);
  const [carouselPointer, setCarouselPointer] = useState({ x: 0, y: 0 });
  const [carouselHover, setCarouselHover] = useState<AgentId | null>(null);
  const [carouselRotation, setCarouselRotation] = useState(0);
  const [carouselAutoplay, setCarouselAutoplay] = useState(false);
  const [carouselDragging, setCarouselDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselRotationRef = useRef(0);
  const carouselDrag = useRef<{ x: number; rotation: number; moved: boolean } | null>(null);
  const suppressCarouselClick = useRef(false);
  const wheelSnapTimer = useRef<number | null>(null);
  const stormVideoRef = useRef<HTMLVideoElement>(null);
  const hermesAsk = trpc.hermes.ask.useMutation();
  const hermesIngest = trpc.hermes.ingest.useMutation();
  const hermesComplete = trpc.hermes.completeIngestion.useMutation();
  const ideaAsk = trpc.agents.chat.useMutation();
  const { data: currentUser } = trpc.auth.me.useQuery();
  const workspaceQuery = trpc.workspace.load.useQuery(undefined, { enabled: Boolean(currentUser), retry: false });
  const workspaceSave = trpc.workspace.save.useMutation();
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const workspaceHydrated = useRef(false);
  const localWorkspaceHydrated = useRef(false);

  useEffect(() => {
    if (!currentUser) {
      workspaceHydrated.current = false;
      setWorkspaceReady(false);
      return;
    }
    if (workspaceQuery.isError) {
      workspaceHydrated.current = true;
      return;
    }
    if (!workspaceQuery.isSuccess || workspaceHydrated.current) return;
    const saved = workspaceQuery.data.snapshot as Record<string, any> | null;
    if (saved?.schemaVersion === 1) {
      setOnboardingComplete(Boolean(saved.onboardingComplete));
      setChallenge(typeof saved.challenge === "string" ? saved.challenge : "Build a trustworthy AI mentor for hackathon teams");
      setEvent(typeof saved.event === "string" ? saved.event : "Guidathon 2026");
      setTeam(typeof saved.team === "string" ? saved.team : "3 builders · 48 hours");
      setUncertainty(typeof saved.uncertainty === "string" ? saved.uncertainty : "");
      if (navItems.some(item => item.id === saved.activeNav)) setActiveNav(saved.activeNav as NavId);
      if (agents.some(agent => agent.id === saved.activeAgent)) setActiveAgent(saved.activeAgent as AgentId);
      if (Array.isArray(saved.sources)) setSources(saved.sources.filter((item: any) => item && typeof item.id === "string").slice(0, 80).map((item: SourceRecord) => ({ ...item, status: item.status === "processing" ? "unverified" : item.status })));
      if (Array.isArray(saved.hermesMessages)) setHermesMessages(saved.hermesMessages.slice(-100));
      if (Array.isArray(saved.activities)) setActivities(saved.activities.slice(0, 100));
      if (Array.isArray(saved.tasks)) setTasks(saved.tasks.filter((task: any) => task && typeof task.title === "string" && typeof task.owner === "string" && typeof task.date === "string" && ["next", "queued", "done"].includes(task.status)).slice(0, 100));
      setIdeaRun(Boolean(saved.ideaRun));
      setStackRun(Boolean(saved.stackRun));
      setIdeaInput(typeof saved.ideaInput === "string" ? saved.ideaInput : "");
      setIdeaResponse(typeof saved.ideaResponse === "string" ? saved.ideaResponse : "");
      setSubmissionInput(typeof saved.submissionInput === "string" ? saved.submissionInput : "");
      setSubmissionResult(typeof saved.submissionResult === "string" ? saved.submissionResult : "");
      setManualNote(typeof saved.manualNote === "string" ? saved.manualNote : "");
      setUploadedName(typeof saved.uploadedName === "string" ? saved.uploadedName : "");
      if (saved.themeMode === "dark" || saved.themeMode === "light") setThemeMode(saved.themeMode);
      if (typeof saved.goldFlakes === "boolean") setGoldFlakes(saved.goldFlakes);
    }
    workspaceHydrated.current = true;
    setWorkspaceReady(true);
  }, [currentUser, workspaceQuery.isSuccess, workspaceQuery.data]);

  useEffect(() => {
    let lastUpdate = 0;
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const now = performance.now();
      if (now - lastUpdate < 40) return;
      lastUpdate = now;
      setCursor({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("guidathon-theme", themeMode); localStorage.setItem("guidathon-gold-flakes", goldFlakes ? "on" : "off"); } catch { /* storage may be unavailable */ }
  }, [themeMode, goldFlakes]);

  // Thunder is intentionally user-triggered; no periodic or autoplay audio.

  useEffect(() => {
    if (!entered || activeNav !== "Agents" || !carouselAutoplay || carouselHover || carouselDragging) return;
    const driftTimer = window.setInterval(() => {
      const nextRotation = carouselRotationRef.current - 0.42;
      carouselRotationRef.current = nextRotation;
      setCarouselRotation(nextRotation);
      const step = 360 / agents.length;
      const frontIndex = ((Math.round(-nextRotation / step) % agents.length) + agents.length) % agents.length;
      setActiveAgent(current => current === agents[frontIndex].id ? current : agents[frontIndex].id);
    }, 32);
    return () => window.clearInterval(driftTimer);
  }, [entered, activeNav, carouselAutoplay, carouselHover, carouselDragging]);

  useEffect(() => {
    if (activeNav !== "Agents") return;
    const index = agents.findIndex(agent => agent.id === activeAgent);
    const rotation = -Math.max(0, index) * (360 / agents.length);
    carouselRotationRef.current = rotation;
    setCarouselRotation(rotation);
  }, [activeNav]);

  const allChunks = useMemo(() => sources.filter(source => source.status === "verified").flatMap(source => source.chunks), [sources]);

  const durableSnapshot = useMemo(() => ({
    schemaVersion: 1,
    onboardingComplete, challenge, event, team, uncertainty, activeNav, activeAgent,
    sources, hermesMessages, activities, tasks, ideaRun, stackRun, ideaInput, ideaResponse,
    submissionInput, submissionResult, manualNote, uploadedName, themeMode, goldFlakes,
  }), [onboardingComplete, challenge, event, team, uncertainty, activeNav, activeAgent, sources, hermesMessages, activities, tasks, ideaRun, stackRun, ideaInput, ideaResponse, submissionInput, submissionResult, manualNote, uploadedName, themeMode]);

  useEffect(() => {
    if (currentUser || localWorkspaceHydrated.current) return;
    try {
      const raw = localStorage.getItem("guidathon-workspace-v1");
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, any>;
        if (saved?.schemaVersion === 1) {
          setOnboardingComplete(Boolean(saved.onboardingComplete));
          setChallenge(typeof saved.challenge === "string" ? saved.challenge : "Build a trustworthy AI mentor for hackathon teams");
          setEvent(typeof saved.event === "string" ? saved.event : "Guidathon 2026");
          setTeam(typeof saved.team === "string" ? saved.team : "3 builders · 48 hours");
          setUncertainty(typeof saved.uncertainty === "string" ? saved.uncertainty : "");
          if (navItems.some(item => item.id === saved.activeNav)) setActiveNav(saved.activeNav as NavId);
          if (agents.some(agent => agent.id === saved.activeAgent)) setActiveAgent(saved.activeAgent as AgentId);
          if (Array.isArray(saved.sources)) setSources(saved.sources.filter((item: any) => item && typeof item.id === "string").slice(0, 40).map((item: SourceRecord) => ({ ...item, status: item.status === "processing" ? "unverified" : item.status })));
          if (Array.isArray(saved.hermesMessages)) setHermesMessages(saved.hermesMessages.slice(-60));
          if (Array.isArray(saved.activities)) setActivities(saved.activities.slice(0, 40));
          if (Array.isArray(saved.tasks)) setTasks(saved.tasks.slice(0, 60));
          setIdeaRun(Boolean(saved.ideaRun));
          setStackRun(Boolean(saved.stackRun));
          setIdeaInput(typeof saved.ideaInput === "string" ? saved.ideaInput : "");
          setIdeaResponse(typeof saved.ideaResponse === "string" ? saved.ideaResponse : "");
          setSubmissionInput(typeof saved.submissionInput === "string" ? saved.submissionInput : "");
          setSubmissionResult(typeof saved.submissionResult === "string" ? saved.submissionResult : "");
          setManualNote(typeof saved.manualNote === "string" ? saved.manualNote : "");
          setUploadedName(typeof saved.uploadedName === "string" ? saved.uploadedName : "");
          if (saved.themeMode === "dark" || saved.themeMode === "light") setThemeMode(saved.themeMode);
        }
      }
    } catch { /* Invalid or unavailable local snapshots fall back to a clean workspace. */ }
    localWorkspaceHydrated.current = true;
  }, [currentUser]);

  useEffect(() => {
    if (currentUser || !localWorkspaceHydrated.current) return;
    const timer = window.setTimeout(() => {
      try { localStorage.setItem("guidathon-workspace-v1", JSON.stringify(durableSnapshot)); }
      catch { /* Large browser storage snapshots are optional; active work remains usable. */ }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [currentUser, durableSnapshot]);

  useEffect(() => {
    if (!currentUser || !workspaceReady) return;
    const timer = window.setTimeout(() => workspaceSave.mutate({ snapshot: durableSnapshot }), 850);
    return () => window.clearTimeout(timer);
  }, [currentUser, workspaceReady, durableSnapshot]);
  const selected = agentById(activeAgent);
  const readyCount = sources.filter(source => source.status === "verified").length;
  const readinessScore = Math.min(96, 26 + (challenge.trim().length > 24 ? 14 : 0) + readyCount * 8 + (ideaRun ? 16 : 0) + (stackRun ? 14 : 0) + (submissionInput.trim() ? 14 : 0) + Math.min(12, tasks.filter(task => task.status === "done").length * 3));
  const activeNavAgent: Partial<Record<NavId, AgentId>> = {
    Sources: "hermes",
    "Challenge Brief": "hermes",
    "Idea Lab": "athena",
    "Technical Plan": "hephaestus",
    "Timeline & Tasks": "chronos",
  };

  const pushActivity = (agent: AgentId, action: string, detail: string, state: Activity["state"] = "complete") => {
    setActivities(current => [
      { id: `${Date.now()}-${Math.random()}`, agent, action, detail, time: "now", state },
      ...current,
    ].slice(0, 7));
  };

  const updateCarouselRotation = (rotation: number) => {
    carouselRotationRef.current = rotation;
    setCarouselRotation(rotation);
  };

  const focusAgent = (id: AgentId) => {
    const nextIndex = agents.findIndex(agent => agent.id === id);
    updateCarouselRotation(-nextIndex * (360 / agents.length));
    setActiveAgent(id);
  };

  const selectAgent = (id: AgentId) => {
    const nextAgent = agentById(id);
    setHandoff({ from: selected.name, to: nextAgent.name });
    focusAgent(id);
    pushActivity("zeus", `Routed context to ${nextAgent.name}`, `${selected.name} → ${nextAgent.name}: ${uncertainty || "open question"}`, "live");
    window.setTimeout(() => setHandoff(null), 2100);
  };

  const enterAgentRoom = (id: AgentId) => {
    selectAgent(id);
    setActiveNav(agentRoomFor[id]);
  };

  const moveCarousel = (direction: -1 | 1) => {
    const currentIndex = agents.findIndex(agent => agent.id === activeAgent);
    const nextIndex = (currentIndex + direction + agents.length) % agents.length;
    focusAgent(agents[nextIndex].id);
  };

  const snapCarouselToNearest = () => {
    const step = 360 / agents.length;
    const snapped = Math.round(carouselRotationRef.current / step) * step;
    const index = ((Math.round(-snapped / step) % agents.length) + agents.length) % agents.length;
    focusAgent(agents[index].id);
  };

  const handleCarouselWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) < 1 && Math.abs(event.deltaY) < 1) return;
    event.preventDefault();
    setCarouselDragging(true);
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    updateCarouselRotation(carouselRotationRef.current - delta * 0.42);
    if (wheelSnapTimer.current !== null) window.clearTimeout(wheelSnapTimer.current);
    wheelSnapTimer.current = window.setTimeout(() => {
      snapCarouselToNearest();
      setCarouselDragging(false);
      wheelSnapTimer.current = null;
    }, 150);
  };

  const handleCarouselKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); moveCarousel(-1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); moveCarousel(1); }
    else if (event.key === "Home") { event.preventDefault(); selectAgent(agents[0].id); }
    else if (event.key === "End") { event.preventDefault(); selectAgent(agents[agents.length - 1].id); }
    else if (event.key === " ") { event.preventDefault(); setCarouselAutoplay(value => !value); }
  };

  const handleCarouselMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setCarouselPointer({ x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2, y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2 });
  };

  const handleCarouselPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const startedOnCard = Boolean((event.target as HTMLElement).closest("button"));
    suppressCarouselClick.current = false;
    carouselDrag.current = { x: event.clientX, rotation: carouselRotationRef.current, moved: false };
    setCarouselDragging(true);
    if (!startedOnCard) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is an enhancement. */ }
    }
  };

  const handleCarouselDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!carouselDrag.current) return;
    const delta = event.clientX - carouselDrag.current.x;
    if (Math.abs(delta) > 5) carouselDrag.current.moved = true;
    updateCarouselRotation(carouselDrag.current.rotation + delta * 0.48);
  };

  const handleCarouselPointerUp = () => {
    if (!carouselDrag.current) return;
    const moved = carouselDrag.current.moved;
    carouselDrag.current = null;
    setCarouselDragging(false);
    if (moved) {
      suppressCarouselClick.current = true;
      snapCarouselToNearest();
    }
  };

  const triggerClickSpark = (event: React.PointerEvent<HTMLDivElement>) => {
    const nextSpark = { id: Date.now(), x: event.clientX, y: event.clientY };
    setClickSpark(nextSpark);
    playThunderRumble();
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
    const corpusTerms = allChunks.map(chunk => new Set(tokenize(`${chunk.heading} ${chunk.passage}`)));
    const documentFrequency: Record<string, number> = {};
    for (const term of new Set(tokenize(question))) {
      documentFrequency[term] = corpusTerms.filter(terms => terms.has(term)).length;
    }
    const ranked = allChunks
      .map(chunk => ({ ...chunk, score: scorePassage(question, `${chunk.heading} ${chunk.passage}`, allChunks.length, documentFrequency) }))
      .filter(chunk => (chunk.score ?? 0) >= 0.16)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
    setRetrieval(ranked);
    setHermesMessages(current => [...current, { role: "user", content: question }]);
    setHermesInput("");
    pushActivity("hermes", "Retrieved source chunks", ranked.length ? `${ranked.length} chunks attached to the model request.` : "No matching chunk; Hermes will label the answer as general guidance.", "live");
    hermesAsk.mutate({
      question,
      provider: "gemini",
      context: ranked,
      history: hermesMessages.slice(-6).map(message => ({ role: message.role, content: message.content })),
    }, {
      onSuccess: result => {
        setHermesMessages(current => [...current, { role: "assistant", content: result.answer, citations: result.citations }]);
        if (result.retrieved?.length) setRetrieval(result.retrieved as Chunk[]);
        if (result.handoffTo) {
          const target = agentById(result.handoffTo);
          setHandoff({ from: "Hermes", to: target.name });
          setActiveAgent(result.handoffTo);
          setActiveNav(agentRoomFor[result.handoffTo]);
          window.setTimeout(() => setHandoff(null), 2100);
        }
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
    const canParse = record.kind !== "upload" || !record.detail.toLowerCase().includes("unverified");
    const finishLocalProcessing = (persisted: boolean) => {
      window.setTimeout(() => {
        if (!canParse) {
          setSources(current => current.map(source => source.id === record.id ? { ...source, status: "unverified", detail: "Metadata captured · content not parsed" } : source));
          pushActivity("hermes", "Kept an upload unverified", `${record.name} was not parsed and cannot enter retrieval.`, "complete");
          return;
        }
        const markLocal = () => {
          setSources(current => current.map(source => source.id === record.id ? { ...source, status: "verified", detail: `${record.chunks.length} chunks · locally parsed · not persisted` } : source));
          pushActivity("hermes", "Processed a new source locally", `${record.name} is available in this browser session; server persistence is unavailable.`, "complete");
        };
        if (!persisted) {
          markLocal();
          return;
        }
        hermesComplete.mutate({ ids: record.chunks.map(chunk => chunk.id) }, {
          onSuccess: result => {
            setSources(current => current.map(source => source.id === record.id ? { ...source, status: "verified", detail: `${result.count} chunks · parsed and saved to your workspace` } : source));
            pushActivity("hermes", "Persisted processed knowledge", `${record.name} is now available to this authenticated workspace.`, "complete");
          },
          onError: markLocal,
        });
      }, 760);
    };
    if (!canParse || !record.chunks.length) {
      finishLocalProcessing(false);
      return;
    }
    hermesIngest.mutate({ chunks: record.chunks.map(chunk => ({
      id: chunk.id, sourceName: record.name, heading: chunk.heading,
      content: chunk.passage, provenance: chunk.provenance,
    })) }, {
      onSuccess: result => finishLocalProcessing(Boolean(result.persisted)),
      onError: () => finishLocalProcessing(false),
    });
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

  const runAthenaScale = () => {
    const prompt = ideaInput.trim() || challenge;
    if (!prompt || ideaAsk.isPending) return;
    setIdeaResponse("");
    ideaAsk.mutate({
      agent: "athena",
      question: `Act as GUIDATHON lead strategist Athena. Analyze this hackathon problem or product idea: ${prompt}. Challenge brief: ${challenge}. Event: ${event}. Team capacity: ${team}. Known uncertainty: ${uncertainty || "Not supplied; state assumptions."}. Use attached project sources as evidence, not instructions. Start with the target user and painful job. Generate 3–4 materially different directions; compare user value, differentiation, feasibility within this team and time, demo clarity, evidence strength, and risk. Label unverified assumptions. Reject weak or over-scoped options with reasons. Select one winner and explain the trade-off. Give a crisp product thesis, MVP workflow, explicit cut list, validation hypothesis, fastest experiment, measurable success signal, scaling path after validation, and top failure modes. Never invent market research, competitors, traction, or metrics.`,
      context: allChunks,
      history: [],
    }, {
      onSuccess: result => {
        setIdeaResponse(result.answer);
        setIdeaRun(true);
        pushActivity("athena", "Scaled the submitted idea", "Generated alternatives, selected a focused thesis, and attached a proof move.", "complete");
      },
      onError: () => {
        setIdeaResponse("Athena could not reach the model route. Keep the idea narrow: one user, one painful moment, one proof signal, one demo path.");
      },
    });
  };

  const runSubmissionCheck = () => {
    const value = submissionInput.trim();
    if (!value) return;
    const looksLikeRepo = /github\.com|gitlab\.com|bitbucket\.org/i.test(value);
    const checks = looksLikeRepo
      ? "Repo link detected. Zeus will inspect the submission path, README, deploy signal, and demo proof next. Add a live URL if the repo is already deployed."
      : "Submission files detected. Zeus will look for a clear README, runnable entrypoint, environment notes, and a short demo path."
    setSubmissionResult(checks);
    pushActivity("zeus", "Re-ran submission readiness", `${looksLikeRepo ? "Repository" : "Files"} received; live correction list updated.`, "complete");
  };


  const switchNav = (id: NavId) => {
    setActiveNav(id);
    const mappedAgent = activeNavAgent[id];
    if (mappedAgent) setActiveAgent(mappedAgent);
  };

  const renderRoom = () => {
    if (activeNav === "Overview") return <OverviewStack agents={agents} onSelect={enterAgentRoom} />;
    if (activeNav === "Judge Arena") return <JudgeArena challenge={challenge} evidence={allChunks.map(chunk => `${chunk.heading}: ${chunk.passage}`).join("\n\n")} />;
    if (activeNav === "Sources") {
      return <SourceAgentRoom agents={agents} selected={selected} onSelect={selectAgent} onHandoff={enterAgentRoom} context={allChunks} sources={sources} manualNote={manualNote} setManualNote={setManualNote} addManualNote={addManualNote} onUpload={() => fileInputRef.current?.click()} uploadedName={uploadedName} />;
    }
    if (activeNav === "Settings") {
      return <div className="room-body settings-room"><div className="settings-card"><div className="section-kicker"><span className="kicker-dot gold" /> Workspace controls</div><h3>Shape the constellation to your working style.</h3><div className="setting-row"><div><b>Theme field</b><p>Switch between the storm console and a clear light workspace.</p></div><button className={`theme-switch ${themeMode}`} onClick={() => setThemeMode(mode => mode === "dark" ? "light" : "dark")}><span /> {themeMode === "dark" ? "dark storm" : "light field"}</button></div><div className="setting-row"><div><b>Gold flake field</b><p>Ambient gold particles and cursor sparks; independently switchable in either theme.</p></div><button className={`theme-switch ${goldFlakes ? "dark" : "light"}`} aria-pressed={goldFlakes} onClick={() => setGoldFlakes(value => !value)}><span /> {goldFlakes ? "gold flakes on" : "normal field"}</button></div><div className="setting-row"><div><b>Interaction sound</b><p>Click-only spark and rumble; no passive audio.</p></div><span className="integration-pill unverified">enabled</span></div></div><div className="history-card"><div className="section-kicker"><span className="kicker-dot blue" /> Agent history</div><h3>What the spirits have done</h3><div className="history-log">{activities.map(activity => <div className="history-row" key={activity.id}><span className="mono">{activity.time}</span><b>{agentById(activity.agent).name}</b><span>{activity.action} — {activity.detail}</span></div>)}</div></div></div>;
    }
    if (activeNav === "Agents") {
      return (
        <div className={`agents-room-body constellation-3d-room constellation-only accent-${selected.accent}`}>
          <div className="agent-carousel-stage" role="region" tabIndex={0} aria-label="Interactive 3D circular agent carousel. Use left and right arrows to select agents, Home and End to jump, Space to toggle auto-rotation, drag or scroll to rotate." onKeyDown={handleCarouselKeyDown} onWheel={handleCarouselWheel} onPointerMove={event => { handleCarouselMove(event); handleCarouselDrag(event); }} onPointerDown={handleCarouselPointerDown} onPointerUp={handleCarouselPointerUp} onPointerCancel={handleCarouselPointerUp} onPointerLeave={() => { setCarouselPointer({ x: 0, y: 0 }); setCarouselHover(null); if (carouselDrag.current) handleCarouselPointerUp(); }}>
            <div className="carousel-stars" />
            <ShaderConstellation pointer={carouselPointer} />
            <div className="carousel-3d-world" style={{ "--tilt-x": `${-carouselPointer.y * 7}deg`, "--tilt-y": `${carouselPointer.x * 9}deg` } as CSSProperties}>
              <div className="carousel-ring ring-outer" /><div className="carousel-ring ring-inner" /><div className="carousel-gate" />
              <div className={`carousel-focus accent-${selected.accent}`}><div className="focus-energy" /><img src={selected.art} alt={`${selected.name} selected spirit`} /><div className="focus-copy"><span className="mono">selected spirit</span><b>{selected.name}</b><small>ENTER CHATSPACE ↘</small></div></div>
              <div className="agent-card-orbit" style={{ "--orbit-rotation": `${carouselRotation}deg` } as CSSProperties}>
                {agents.map((agent, index) => {
                  const angle = (index / agents.length) * 360 - 90;
                  return <button key={agent.id} className={`agent-card-3d accent-${agent.accent} ${activeAgent === agent.id ? "active" : ""} ${carouselHover === agent.id ? "hovered" : ""}`} style={{ "--card-angle": `${angle}deg`, "--card-delay": `${index * 90}ms` } as CSSProperties} onPointerEnter={() => setCarouselHover(agent.id)} onClick={event => { if (suppressCarouselClick.current) { event.preventDefault(); suppressCarouselClick.current = false; return; } selectAgent(agent.id); }} aria-label={`Preview ${agent.name} model overview`}><span className="agent-card-sheen" /><span className="agent-card-silhouette" /><span className="agent-portrait-frame"><img src={agent.art} alt={`${agent.name} chibi spirit face card`} /></span><span className="agent-card-footer"><b>{agent.name}</b><small>{agent.role}</small></span><span className="agent-card-index">0{index + 1}</span></button>;
                })}
              </div>
            </div>
            <div className="carousel-instruction">
              <div className="carousel-instruction-copy"><span className="mono">ACTIVE ORBIT // {selected.name.toUpperCase()}</span><span>drag · scroll · arrows · click to focus</span></div>
              <div className="carousel-controls" aria-label="Carousel controls">
                <button type="button" onClick={() => moveCarousel(-1)} aria-label="Previous agent">PREV</button>
                <button type="button" className={carouselAutoplay ? "is-playing" : ""} onClick={() => setCarouselAutoplay(value => !value)} aria-pressed={carouselAutoplay}>{carouselAutoplay ? "PAUSE" : "AUTO"}</button>
                <button type="button" onClick={() => moveCarousel(1)} aria-label="Next agent">NEXT</button>
              </div>
            </div>
          </div>
          <ConstellationAgentDock agents={agents} selected={selected} onFocus={focusAgent} onEnter={enterAgentRoom} />
        </div>
      );
    }
    if (activeAgent === "hermes") {
      return (
        <div className="room-body hermes-room">
          <div className="hermes-chat room-column">
            <div className="section-kicker"><span className="kicker-dot blue" /> Hermes knowledge room</div>
            <h3>Ask the guide anything about hackathons.</h3>
            <p className="room-intro">Hermes retrieves relevant passages from your project knowledge and uses an available model when configured; offline mode shows the retrieved evidence without inventing citations. Ask about rules, judging, scope, teams, demos, or what to build next.</p>
            <div className="hermes-transcript">
              <div className="chat-companion-floating" aria-hidden="true"><img src={agentById("hermes").art} alt="" /><span>Hermes</span></div>
              <div className="chat-bubble assistant"><div className="chat-speaker"><span className="chat-avatar">✦</span><b>Hermes</b><span>guide + knowledge</span></div><p>Ask me what a hackathon is, how judging works, or how to turn your idea into a weekend-sized build. I will separate cited facts from general guidance.</p></div>
              {hermesMessages.map((message, index) => <div className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}><div className="chat-speaker"><span className="chat-avatar">{message.role === "assistant" ? "✦" : "you"}</span><b>{message.role === "assistant" ? "Hermes" : "You"}</b></div><p>{message.content}</p>{message.citations?.length ? <div className="chat-citations">{message.citations.map(citation => <a key={citation} href={`#evidence-${encodeURIComponent(citation)}`}>{citation}</a>)}</div> : null}</div>)}
              {hermesAsk.isPending && <div className="chat-bubble assistant thinking"><div className="chat-speaker"><span className="chat-avatar">✦</span><b>Hermes</b><span>retrieving + thinking</span></div><p><span className="thinking-dot" /> <span className="thinking-dot" /> <span className="thinking-dot" /> I&apos;m checking the source pack and composing a precise answer…</p></div>}
            </div>
            <div className="hermes-composer"><textarea value={hermesInput} onChange={event => setHermesInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); askHermes(); } }} placeholder="e.g. What makes a hackathon idea defensible?" rows={2} /><button className="primary-button" onClick={askHermes} disabled={hermesAsk.isPending || !hermesInput.trim()}>{hermesAsk.isPending ? "Hermes is thinking" : "Ask Hermes"}<ArrowUpRight size={15} /></button></div>
            <div className="retrieval-state"><span className="status-dot live" /> Hermes RAG · {readyCount} processed sources · {allChunks.length} chunks · parse status is not fact-checking · Enter to send</div>
            {retrieval.length > 0 && <div className="retrieval-results hermes-evidence"><div className="result-heading"><span>Evidence attached to latest answer</span><span className="mono">{retrieval.length} matches</span></div>{retrieval.map(chunk => <div className="chunk-card" id={`evidence-${encodeURIComponent(chunk.id)}`} key={chunk.id}><div className="chunk-meta"><span className="mono chunk-id">{chunk.id}</span><span className="score">match {Math.round((chunk.score ?? 0) * 100)}%</span></div><h4>{chunk.heading}</h4><p>{chunk.passage}</p><div className="chunk-source"><Link2 size={12} /> <span>{chunk.source}</span> · {chunk.provenance} {sourceUrlFromProvenance(chunk.provenance) && <a href={sourceUrlFromProvenance(chunk.provenance)!} target="_blank" rel="noreferrer">Open original source ↗</a>}</div></div>)}</div>}
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
            <div className="idea-lab-input"><textarea value={ideaInput} onChange={event => setIdeaInput(event.target.value)} placeholder="Add your idea or problem statement for Athena to scale…" rows={3} /><button className="primary-button" onClick={runAthenaScale} disabled={ideaAsk.isPending}><WandSparkles size={16} /> {ideaAsk.isPending ? "Athena is comparing" : ideaRun ? "Scale again" : "Scale this idea"}</button></div>
            {ideaResponse && <div className="idea-response"><span className="mono">ATHENA / MODEL OUTPUT</span><p>{ideaResponse}</p></div>}
          </div>
          <div><div className="decision-card"><div className="decision-icon"><Sparkles size={18} /></div><div><span className="section-kicker">Athena&apos;s read</span><h3>Make the evidence loop the product.</h3><p>Your uncertainty is scope, not novelty. The defensible move is to prove that a team can move from ambiguity to a cited, buildable decision in minutes.</p><div className="decision-line"><Check size={14} /> Handoff ready for Hephaestus</div></div></div><AgentRoleChat agent={agentById("athena")} context={allChunks} onHandoff={next => { setActiveAgent(next); setActiveNav(agentRoomFor[next]); }} /></div>
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
          <div><div className="architecture-card"><div className="architecture-top"><span className="section-kicker">Architecture signal</span><span className="integration-pill mocked">model route</span></div><div className="architecture-flow"><span>source intake</span><ChevronRight size={14} /><span>chunk store</span><ChevronRight size={14} /><span>agent router</span><ChevronRight size={14} /><span>output</span></div><p>No hidden calls. Every boundary is inspectable now; the live Hephaestus channel can explain what to cut before the demo.</p><div className="architecture-note"><CircleHelp size={14} /> MCP tool bench above · provider confirmed after each reply</div></div><McpToolsPanel /><AgentRoleChat agent={agentById("hephaestus")} context={allChunks} onHandoff={next => { setActiveAgent(next); setActiveNav(agentRoomFor[next]); }} /></div>
        </div>
      );
    }

    if (activeAgent === "chronos") {
      return (
        <div className="room-body split-room">
          <div className="room-column">
            <div className="section-kicker"><span className="kicker-dot teal" /> Deadline engine</div>
            <h3>Time becomes another handoff.</h3>
            <p className="room-intro">Chronos turns the chosen direction into a sequence the team can actually follow. Dates are illustrative defaults; set real dates before relying on this timeline.</p>
            <div className="task-list">{tasks.map(task => <div className="task-row" key={task.title}><button type="button" className={`task-check ${task.status === "done" ? "checked" : ""}`} aria-label={task.status === "done" ? `Reopen ${task.title}` : `Complete ${task.title}`} onClick={() => setTasks(current => current.map(item => item.title === task.title ? { ...item, status: item.status === "done" ? "next" : "done" } : item))}>{task.status === "done" && <Check size={12} />}</button><div className="task-main"><b>{task.title}</b><span>{task.owner} · {task.date}</span></div><span className={`task-status ${task.status}`}>{task.status}</span></div>)}</div>
            <form className="task-add-form" onSubmit={event => { event.preventDefault(); const title = newTaskTitle.trim(); if (!title) return; setTasks(current => current.some(task => task.title.toLowerCase() === title.toLowerCase()) ? current : [{ title, owner: newTaskOwner.trim() || "Team", date: newTaskDate.trim() || "Before submission", status: "next" as const }, ...current].slice(0, 100)); setNewTaskTitle(""); }}>
              <input aria-label="New task title" value={newTaskTitle} onChange={event => setNewTaskTitle(event.target.value)} placeholder="Add a milestone or task…" maxLength={180} />
              <input aria-label="Task owner" value={newTaskOwner} onChange={event => setNewTaskOwner(event.target.value)} placeholder="Owner" maxLength={60} />
              <input aria-label="Task due date" value={newTaskDate} onChange={event => setNewTaskDate(event.target.value)} placeholder="Due / checkpoint" maxLength={80} />
              <button type="submit" className="small-action" disabled={!newTaskTitle.trim()}><Plus size={13} /> Add task</button>
            </form>
            <button className="primary-button" onClick={() => pushActivity("chronos", "Recorded the next deadline", "Lock one user + painful moment · Today at 18:00", "complete")}><CalendarClock size={16} /> Log next deadline</button>
          </div>
          <div><div className="countdown-card"><span className="section-kicker">Submission window</span><div className="countdown">48<span>h</span> 12<span>m</span></div><p>until the demo cut-off</p><div className="progress-line"><span style={{ width: `${Math.max(18, readinessScore)}%` }} /></div><div className="countdown-foot"><span>Readiness signal</span><span className="mono">{readinessScore}/100</span></div></div><AgentRoleChat agent={agentById("chronos")} context={allChunks} onHandoff={next => { setActiveAgent(next); setActiveNav(agentRoomFor[next]); }} /></div>
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
          <div><div className="orchestration-card"><Network size={20} /><span className="section-kicker">Signal integrity</span><strong>3 handoffs visible</strong><p>Each room can inspect the prior room&apos;s context. Zeus coordinates the live model route and makes missing inputs explicit.</p><div className="integration-pill mocked">Gemini / Groq fallback route</div></div><AgentRoleChat agent={agentById("zeus")} context={allChunks} onHandoff={next => { setActiveAgent(next); setActiveNav(agentRoomFor[next]); }} /></div>
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
    <div className={`app-shell theme-${themeMode} ${entered ? "has-entered" : "is-landing"}`} onPointerDown={triggerClickSpark}>
      <video ref={stormVideoRef} className="storm-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true"><source src="/media/guidathon-storm-loop.mp4" type="video/mp4" /></video>
      <div className="storm-noise" />
      {goldFlakes && <AntigravityField cursor={cursor} spark={clickSpark} />}
      {handoff && <div className="handoff-transition" aria-live="polite"><div className="cloud-curtain cloud-left" /><div className="cloud-curtain cloud-right" /><div className="cloud-mist cloud-mist-one" /><div className="cloud-mist cloud-mist-two" /><div className="handoff-transition-copy"><span className="mono">CONTEXT IN MOTION</span><strong>{handoff.from} <i>→</i> {handoff.to}</strong><small>carrying the latest brief forward</small></div></div>}
      <section className={`landing-screen ${entered ? "landing-exit" : ""}`} onClick={enterWorkspace}>
        <div className="landing-veil" />
        <div className="landing-content"><div className="landing-sigil">✦</div><div className="landing-wordmark">GUIDA<span>THON</span></div><div className="landing-lockup">evidence / action / outcome</div><div className="landing-reveal-title">The constellation is ready.</div></div>
        <button className="landing-cue" onClick={event => { event.stopPropagation(); enterWorkspace(); }}><span className="cue-pulse" /> click anywhere to begin</button>
      </section>
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-sigil">✦</div><div><div className="brand-wordmark">GUIDA<span>THON</span></div><div className="brand-subtitle">evidence / action / outcome</div></div></div>
        <div className="topbar-status" aria-live="polite"><span className="status-dot live" /> workspace ready <span className="status-divider" /> <span className="mono">{currentUser ? (workspaceSave.isPending ? "SAVING..." : workspaceSave.isError || workspaceQuery.isError ? "CLOUD SAVE ISSUE" : workspaceReady ? "CLOUD WORKSPACE" : "LOADING WORKSPACE") : "LOCAL SESSION"}</span></div>
        <div className="topbar-actions"><button className="icon-button theme-toggle" aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} theme`} title={`Switch to ${themeMode === "dark" ? "light" : "dark"} theme`} onClick={() => setThemeMode(mode => mode === "dark" ? "light" : "dark")}>{themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><button className={`icon-button flakes-toggle ${goldFlakes ? "active" : ""}`} aria-pressed={goldFlakes} aria-label={goldFlakes ? "Turn gold flakes off" : "Turn gold flakes on"} title={goldFlakes ? "Gold flakes on" : "Gold flakes off"} onClick={() => setGoldFlakes(value => !value)}><Sparkles size={16} /></button><button className="help-button" aria-label="What is GUIDATHON?" onClick={() => setAboutOpen(true)}><CircleHelp size={17} /></button></div>
      </header>
      <div className="workspace-shell">
        <aside className="line-sidebar">
          <div className="sidebar-caption">workspace</div>
          <AnimatedSidebar activeNav={activeNav} onSelect={switchNav} sourceCount={allChunks.length} />
          <div className="sidebar-bottom"><div className="agent-mini"><div className="mini-avatar hermes">H</div><div><b>Hermes</b><span>guide room</span></div><span className="online-dot" /></div><button className="settings-link" onClick={() => switchNav("Settings")}><Settings2 size={14} /> Workspace settings</button></div>
        </aside>
        <main className="workspace-main">
          {activeNav !== "Overview" && activeNav !== "Agents" && <div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> WORKSPACE / {activeNav.toUpperCase()}</div><h1>{activeNav}</h1><p>The {activeNav.toLowerCase()} room stays connected to your latest handoff.</p></div><div className="heading-actions"><span className="integration-pill unverified"><span className="status-dot live" /> Model on first request · MCP optional</span></div></div>}
          {activeNav === "Overview" || activeNav === "Agents" ? renderRoom() : <section className="room-panel"><div className="room-panel-top"><div className="room-title"><div className={`room-avatar accent-${selected.accent}`}>{selected.glyph}</div><div><div className="eyebrow small">current room / {selected.role.toLowerCase()}</div><h2>{selected.name}<span> · {selected.short}</span></h2></div></div><div className="room-state"><span className="status-dot live" /> working context <span className="mono">HND-{onboardingComplete ? "042" : "001"}</span></div></div><div className="handoff-banner"><ArrowUpRight size={14} /><span><b>Latest handoff</b> {onboardingComplete ? `${event} · ${team} · ${uncertainty}` : "No handoff yet. Hermes is waiting for your first brief."}</span><button onClick={() => { setActiveAgent("zeus"); setActiveNav("Agents"); }} disabled={!onboardingComplete} aria-label={onboardingComplete ? "Inspect the latest Zeus handoff" : "No handoff exists yet"}>inspect thread <ChevronRight size={13} /></button></div>{activeNavAgent[activeNav] && <AgentRoomHero agent={selected} />} {renderRoom()}</section>}
        </main>
      </div>
      <input ref={fileInputRef} type="file" className="hidden-file-input" onChange={handleFile} accept=".txt,.md,.csv,.json,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.yaml,.yml,text/*,.pdf" />
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </div>
  );
}

function AgentRoomHero({ agent }: { agent: AgentRecord }) {
  const lore = agentLore[agent.id];
  const modelRoute = "Provider resolved on request · offline fallback available";
  return (
    <section className={`agent-room-hero accent-${agent.accent}`} data-agent={agent.id}>
      <img className="agent-room-hero-art" src={agent.art} alt="" aria-hidden="true" />
      <div className="agent-room-hero-copy">
        <span className="mono">AGENT DOMAIN // {agent.id.toUpperCase()}</span>
        <h3>{lore.epithet}</h3>
        <p>{lore.myth}</p>
        <div className="agent-room-responsibility"><b>PRIMARY DIRECTIVE</b><span>{lore.responsibility}</span></div>
        <div className="agent-room-handoff">{lore.handoff}</div>
        <span className="agent-model-route">MODEL ROUTE · {modelRoute}</span>
      </div>
      {agent.id === "chronos" && <div className="chronos-hero-clock" aria-hidden="true"><i className="clock-hand hour" /><i className="clock-hand minute" /><span>TIME / IS / A / RESOURCE</span></div>}
      <div className="agent-room-mini"><img src={agent.art} alt={`Mini ${agent.name} chibi avatar`} /><span>{agent.name}</span><small>{agent.role}</small></div>
    </section>
  );
}

function ConstellationAgentDock({ agents, selected, onFocus, onEnter }: { agents: AgentRecord[]; selected: AgentRecord; onFocus: (id: AgentId) => void; onEnter: (id: AgentId) => void }) {
  const lore = agentLore[selected.id];
  return (
    <section className={`constellation-agent-dock accent-${selected.accent}`}>
      <div className="constellation-dock-heading"><span className="mono">MODEL OVERVIEW // SELECTED SPIRIT</span><span className="dock-live"><i /> specialist routing · live provider resolved on send</span></div>
      <div className="constellation-dock-main">
        <ModelViewer agent={selected} />
        <div className="constellation-dock-copy">
          <span className="mono">{selected.theme.toUpperCase()} · {selected.role.toUpperCase()}</span>
          <h3>{selected.name}</h3>
          <p>{lore.responsibility}</p>
          <div className="constellation-dock-lore"><b>{lore.epithet}</b><span>{lore.myth}</span></div>
          <div className="constellation-dock-actions"><button className="primary-button" onClick={() => onEnter(selected.id)}>Enter {selected.name}&apos;s room <ArrowUpRight size={14} /></button><span>Focus a card to preview · enter to open its workspace</span></div>
        </div>
        <div className="constellation-mini-board">
          <span className="mono">JARVIS / AGENT TELEMETRY</span>
          <div><small>DOMAIN</small><b>{selected.short}</b></div>
          <div><small>MODEL ROUTE</small><b>{"Auto route · resolved on request"}</b></div>
          <div><small>HANDOFF</small><b>{lore.handoff}</b></div>
          <div><small>TOOLS</small><b>MCP adapter slots · disconnected</b></div>
        </div>
      </div>
      <div className="constellation-agent-rail" aria-label="All GUIDATHON agents">
        {agents.map((agent, index) => <button key={agent.id} className={agent.id === selected.id ? "active" : ""} onMouseEnter={() => onFocus(agent.id)} onFocus={() => onFocus(agent.id)} onClick={() => onEnter(agent.id)}><img src={agent.art} alt="" /><span><small>0{index + 1}</small><b>{agent.name}</b><em>{agent.role}</em></span><ArrowUpRight size={13} /></button>)}
      </div>
    </section>
  );
}

function OverviewStack({ agents, onSelect }: { agents: AgentRecord[]; onSelect: (id: AgentId) => void }) {
  const stackRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const mythology: Record<AgentId, { aura: string; why: string }> = {
    hermes: { aura: "The messenger at the threshold", why: "Hermes turns ambiguity into a message the rest of the constellation can carry." },
    zeus: { aura: "The keeper of the sky-wide thread", why: "Zeus owns orchestration because every specialist needs one visible source of direction." },
    athena: { aura: "The strategist with a cool blade", why: "Athena tests ideas against evidence, trade-offs, and the smallest proof worth building." },
    hephaestus: { aura: "The maker beneath the mountain", why: "Hephaestus converts a winning thesis into a stack, workflow, and honest build boundary." },
    chronos: { aura: "The ancient shape of time", why: "Chronos makes deadlines tangible by turning progress into milestones with owners and proof." },
  };
  useGSAP(() => {
    const viewport = viewportRef.current;
    const cards = gsap.utils.toArray<HTMLElement>(".overview-stack-card", stackRef.current);
    if (!viewport || cards.length === 0) return;

    gsap.set(cards, { autoAlpha: 0, y: 72, scale: 0.96, filter: "blur(4px)", zIndex: (index) => index + 1, pointerEvents: "none", transformOrigin: "center center" });
    gsap.set(cards[0], { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", pointerEvents: "auto", zIndex: cards.length + 1 });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: viewport,
        start: "top top+=84",
        end: () => `+=${Math.max(window.innerHeight, 520) * 1.15 * Math.max(1, cards.length - 1)}`,
        pin: viewport,
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    cards.slice(0, -1).forEach((card, index) => {
      const next = cards[index + 1];
      timeline.to(card, { y: -48, scale: 0.92, autoAlpha: 0.34, filter: "blur(2px)", pointerEvents: "none", duration: 1 }, index);
      timeline.fromTo(next,
        { y: 72, scale: 0.96, autoAlpha: 0, filter: "blur(4px)", pointerEvents: "none" },
        { y: 0, scale: 1, autoAlpha: 1, filter: "blur(0px)", pointerEvents: "auto", duration: 1 },
        index
      );
    });

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      window.cancelAnimationFrame(refreshFrame);
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, { scope: stackRef });

  return (
    <section ref={stackRef} className="overview-stack-section mythic-scroll-stack">
      <div className="overview-quote">
        <span className="section-kicker"><span className="kicker-dot gold" /> GUIDATHON // THE CONSTELLATION</span>
        <blockquote>“Make the next move defensible.”</blockquote>
        <p>Five mythic roles, one visible path from a rough question to a build the team can stand behind.</p>
      </div>
      <div ref={viewportRef} className="overview-stack-viewport" aria-label="Scrollable stack of five GUIDATHON agents">
        <div className="overview-stack-cards">
          {agents.map((agent, index) => (
            <button className={`overview-stack-card mythic-stack-card accent-${agent.accent}`} key={agent.id} onClick={() => onSelect(agent.id)}>
              <span className="stack-card-number">0{index + 1}</span>
              <div className="stack-card-art-bg" aria-hidden="true"><img src={agent.art} alt="" /></div>
              <div className="stack-card-aura"><span>{mythology[agent.id].aura}</span><img src={agent.art} alt={`${agent.name} chibi spirit`} /></div>
              <div className="stack-card-copy"><span className="mono">{agent.role} · greek myth</span><b>{agent.name}</b><p>{mythology[agent.id].why}</p></div>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
      </div>
      <div className="overview-stack-hint"><span className="mono">SCROLL TO EXPLORE</span><span>Each turn reveals the next spirit</span></div>
    </section>
  );
}
function ModelViewer({ agent }: { agent: AgentRecord }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return <div className={`model-viewer accent-${agent.accent}`} onPointerMove={event => { const rect = event.currentTarget.getBoundingClientRect(); setTilt({ x: ((event.clientY - rect.top) / rect.height - .5) * -14, y: ((event.clientX - rect.left) / rect.width - .5) * 18 }); }} onPointerLeave={() => setTilt({ x: 0, y: 0 })} aria-label={`${agent.name} interactive model viewer`}><div className="model-viewer-grid" /><div className="model-viewer-ring ring-a" /><div className="model-viewer-ring ring-b" /><div className="model-viewer-shadow" /><img src={agent.art} alt={`${agent.name} chibi model`} style={{ transform: `translateY(-8px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${tilt.y * -.08}deg) scale(1.08)` }} /><span className="model-viewer-label">drag gaze · hover to rotate</span></div>;
}

function SourceAgentRoom({ agents, selected, onSelect, onHandoff, context, sources, manualNote, setManualNote, addManualNote, onUpload, uploadedName }: { agents: AgentRecord[]; selected: AgentRecord; onSelect: (id: AgentId) => void; onHandoff: (id: AgentId) => void; context: Chunk[]; sources: SourceRecord[]; manualNote: string; setManualNote: (value: string) => void; addManualNote: () => void; onUpload: () => void; uploadedName: string }) {
  const [index, setIndex] = useState(Math.max(0, agents.findIndex(agent => agent.id === selected.id)));
  const dragRef = useRef<{ x: number; start: number } | null>(null);
  useEffect(() => setIndex(Math.max(0, agents.findIndex(agent => agent.id === selected.id))), [selected.id, agents]);
  const choose = (next: number) => { const normalized = (next + agents.length) % agents.length; setIndex(normalized); onSelect(agents[normalized].id); };
  return <div className={`source-agent-room accent-${selected.accent}`}><div className="source-carousel-shell"><div className="section-kicker"><span className="kicker-dot gold" /> Source carousel // choose a spirit</div><div className="source-carousel" onPointerDown={event => { dragRef.current = { x: event.clientX, start: index }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={event => { if (!dragRef.current) return; const delta = event.clientX - dragRef.current.x; choose(dragRef.current.start + (delta < -30 ? 1 : delta > 30 ? -1 : 0)); dragRef.current = null; }}><button className="carousel-arrow" onClick={() => choose(index - 1)} aria-label="Previous agent">‹</button><div className="source-carousel-track">{agents.map((agent, cardIndex) => { const offset = (cardIndex - index + agents.length) % agents.length; const signed = offset > agents.length / 2 ? offset - agents.length : offset; return <button key={agent.id} className={`source-agent-card accent-${agent.accent} ${agent.id === selected.id ? "active" : ""}`} style={{ "--source-offset": signed } as CSSProperties} onClick={() => choose(cardIndex)}><img src={agent.art} alt={`${agent.name} source card`} /><span className="mono">0{cardIndex + 1}</span><b>{agent.name}</b><small>{agent.role}</small></button>; })}</div><button className="carousel-arrow" onClick={() => choose(index + 1)} aria-label="Next agent">›</button></div><div className="source-carousel-dots">{agents.map(agent => <button key={agent.id} className={agent.id === selected.id ? "active" : ""} onClick={() => choose(agents.findIndex(item => item.id === agent.id))} aria-label={`Select ${agent.name}`} />)}</div></div><div className="source-chat-layout"><div className="choose-room-column"><span className="section-kicker">choose your next room</span><h3>Move the brief onward.</h3>{agents.map(agent => <button key={agent.id} className={agent.id === selected.id ? "active" : ""} onClick={() => choose(agents.findIndex(item => item.id === agent.id))}><span className={`legend-dot accent-${agent.accent}`} /><span><b>{agent.name}</b><small>{agent.role}</small></span><ChevronRight size={14} /></button>)}</div><ModelViewer agent={selected} /><div className={`source-role-chat accent-${selected.accent}`}><div className="source-chat-heading"><span className="mono">{selected.name.toUpperCase()} // PERSONAL ROOM</span><span className="integration-pill unverified">MCP NOT CONNECTED</span></div><AgentRoleChat agent={selected} context={context} onHandoff={onHandoff} /></div></div><div className="source-intake-compact"><SourceIntake sources={sources} manualNote={manualNote} setManualNote={setManualNote} addManualNote={addManualNote} onUpload={onUpload} uploadedName={uploadedName} /></div></div>;
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="About GUIDATHON"><div className="about-modal"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button><span className="section-kicker"><span className="kicker-dot gold" /> What is this site for?</span><h2>A mentorship constellation for teams under a deadline.</h2><p>GUIDATHON helps a hackathon team move from an uncertain brief to a cited decision, a buildable stack, and a submission-safe timeline. The spirits are not a column of fake assistants: each owns a decision and leaves a handoff artifact for the next room.</p><div className="creator-card"><div className="creator-sigil">S</div><div><span className="mono">made by</span><strong>Saketh</strong><p>Sophomore · Vignan. Built as an experimental interface for turning agentic AI into an observable mentorship workflow.</p></div></div><div className="about-actions"><button className="primary-button" onClick={onClose}>Enter the constellation <ArrowUpRight size={15} /></button><span className="mono">evidence / action / outcome</span></div></div></div>;
}

function AnimatedSidebar({ activeNav, onSelect, sourceCount }: { activeNav: NavId; onSelect: (id: NavId) => void; sourceCount: number }) {
  const [focusedIndex, setFocusedIndex] = useState(Math.max(0, navItems.findIndex(item => item.id === activeNav)));
  useEffect(() => {
    const next = navItems.findIndex(item => item.id === activeNav);
    if (next >= 0) setFocusedIndex(next);
  }, [activeNav]);
  const move = (delta: number) => {
    const next = (focusedIndex + delta + navItems.length) % navItems.length;
    setFocusedIndex(next);
    onSelect(navItems[next].id);
  };
  return <nav className="animated-sidebar-list" aria-label="Workspace navigation" onKeyDown={event => {
    if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
    if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
  }}>
    <span className="animated-list-selection" style={{ transform: `translateY(${focusedIndex * 42}px)` }} aria-hidden="true" />
    {navItems.map(({ id, label, icon: Icon }, index) => <button key={id} className={`nav-item animated-list-row ${activeNav === id ? "active" : ""}`} style={{ "--list-index": index } as CSSProperties} onClick={() => { setFocusedIndex(index); onSelect(id); }} onMouseEnter={event => event.currentTarget.style.setProperty("--hover-shift", "7px")} onMouseLeave={event => event.currentTarget.style.setProperty("--hover-shift", "0px")} tabIndex={activeNav === id ? 0 : -1}><span className="nav-line" /><Icon size={15} /><span>{label}</span>{id === "Sources" && <em>{sourceCount}</em>}</button>)}
  </nav>;
}

function SourceIntake({ sources, manualNote, setManualNote, addManualNote, onUpload, uploadedName }: { sources: SourceRecord[]; manualNote: string; setManualNote: (value: string) => void; addManualNote: () => void; onUpload: () => void; uploadedName: string }) {
  return (
    <aside className="source-intake"><div className="section-kicker"><span className="kicker-dot gold" /> Source intake</div><div className="upload-dropzone" onClick={onUpload}><UploadCloud size={19} /><b>{uploadedName || "Drop a brief or upload a file"}</b><span>Text files are parsed locally · other types remain unverified</span><button className="upload-button" onClick={event => { event.stopPropagation(); onUpload(); }}><Paperclip size={14} /> choose file</button></div><div className="manual-note"><div className="manual-heading"><span>or add a manual note</span><span className="mono">UNVERIFIED → PROCESSED</span></div><textarea value={manualNote} onChange={event => setManualNote(event.target.value)} placeholder="Paste a problem statement, judging rubric, or mentor note…" rows={4} /><button className="small-action" onClick={addManualNote} disabled={!manualNote.trim()}><Plus size={14} /> queue note</button></div><div className="source-list"><div className="source-list-heading"><span>Corpus status</span><span className="mono">{sources.length} records</span></div>{sources.slice(0, 4).map(source => <div className="source-row" key={source.id}><div className={`source-icon ${source.status}`}><FileText size={14} /></div><div><b>{source.name}</b><span>{source.detail}</span></div><span className={`source-status ${source.status}`}>{source.status === "verified" ? "READY" : source.status === "processing" ? "PARSE" : "NEW"}</span></div>)}</div><div className="intake-note"><CircleHelp size={13} /><span>Only <b>verified</b> sources enter retrieval. Nothing is silently promoted.</span></div></aside>
  );
}

function McpToolsPanel() {
  const { data, isLoading, isError, refetch } = trpc.agents.tools.useQuery(undefined, { refetchInterval: 60000 });
  const [toolName, setToolName] = useState("");
  const [argumentsText, setArgumentsText] = useState("{}");
  const [confirmed, setConfirmed] = useState(false);
  const [resultText, setResultText] = useState("");
  const call = trpc.agents.callTool.useMutation();
  const tools = data?.tools ?? [];
  const selectedTool = tools.find(tool => tool.name === toolName);
  const requiresConfirmation = selectedTool?.annotations?.readOnlyHint !== true;
  const invoke = () => {
    let args: Record<string, unknown>;
    try {
      const parsed = JSON.parse(argumentsText);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Arguments must be a JSON object.");
      args = parsed as Record<string, unknown>;
    } catch (error) {
      setResultText(error instanceof Error ? error.message : "Invalid JSON arguments");
      return;
    }
    call.mutate({ name: toolName, arguments: args, confirm: confirmed }, {
      onSuccess: value => setResultText(JSON.stringify(value, null, 2)),
      onError: error => setResultText(error.message),
    });
  };
  return (
    <section className="mcp-tools-panel">
      <div className="mcp-tools-head"><div><span className="section-kicker">Hephaestus // external tool bridge</span><h3>MCP tool bench</h3><p>Discover tools from one server-side MCP endpoint. Secrets stay on the server; write-like tools require an explicit confirmation.</p></div><button className="small-action" onClick={() => void refetch()}>refresh tools</button></div>
      {isLoading ? <p className="mcp-state">Discovering configured MCP tools…</p> : isError ? <div className="mcp-unconfigured"><b>Sign in to inspect MCP tools</b><span>Tool schemas and execution are restricted to an authenticated workspace.</span></div> : !data?.configured ? <div className="mcp-unconfigured"><b>No MCP server connected</b><span>Set MCP_SERVER_URL and optionally MCP_SERVER_TOKEN in the server environment, then restart the backend. No tool calls are being simulated.</span></div> : data.reason ? <div className="mcp-unconfigured"><b>MCP server unavailable</b><span>{data.reason}</span></div> : tools.length === 0 ? <div className="mcp-unconfigured"><b>Connected, but no tools were advertised</b><span>Check the server's tools/list response and transport compatibility.</span></div> : (
        <>
          <div className="mcp-tool-list">{tools.map(tool => <button key={tool.name} className={tool.name === toolName ? "active" : ""} onClick={() => { setToolName(tool.name); setResultText(""); setConfirmed(false); }}><b>{tool.name}</b><span>{tool.description || "No description supplied"}</span></button>)}</div>
          {selectedTool && <div className="mcp-tool-run"><b>Run {selectedTool.name}</b><textarea value={argumentsText} onChange={event => setArgumentsText(event.target.value)} rows={3} aria-label="MCP tool JSON arguments" /><label><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> I explicitly approve this call unless the server marks it read-only.</label><button className="primary-button" onClick={invoke} disabled={call.isPending || (requiresConfirmation && !confirmed)}>{call.isPending ? "Calling tool…" : "Run MCP tool"} <ArrowUpRight size={14} /></button></div>}
        </>
      )}
      {resultText && <pre className="mcp-tool-result">{resultText}</pre>}
    </section>
  );
}


function JudgeArena({ challenge, evidence }: { challenge: string; evidence: string }) {
  const [product, setProduct] = useState("GUIDATHON is a mythology-themed multi-agent hackathon workspace. Five specialist agents support research, orchestration, idea validation, technical planning, and delivery. The workspace includes a 3D agent constellation, dedicated rooms, role chat, a MySQL-backed knowledge chunk store with Gemini embeddings when configured, lexical fallback, and an optional MCP adapter. Some visual and planning interactions may still be demo/local-only.");
  const [implementation, setImplementation] = useState("Implemented on a feature branch. Agent chat routes through configured model providers with role prompts. Specialist handoff routing is rule-based. RAG persistence requires DATABASE_URL and GEMINI_API_KEY; MCP requires an HTTPS MCP_SERVER_URL and optional token. CI workflow is defined, but no successful build/test run has been confirmed yet.");
  const [experience, setExperience] = useState("Responsive React interface with dark/light themes, keyboard-operable carousel controls, and reduced-motion/accessibility work still needs a full manual audit.");
  const { data: currentUser } = trpc.auth.me.useQuery();
  const evaluation = trpc.evaluation.evaluate.useMutation();
  const history = trpc.evaluation.history.useQuery(undefined, { enabled: Boolean(currentUser), retry: false });
  const result = evaluation.data;
  return <div className="room-body judge-arena">
    <div className="section-kicker"><span className="kicker-dot gold" /> Independent scoring / 8 dimensions</div>
    <h3>Judge Arena</h3>
    <p className="room-intro">A skeptical AI judge scores the evidence you provide. Missing proof lowers the score; planned features do not count as shipped work.</p>
    <div className="judge-input-grid">
      <label>Product / core loop<textarea value={product} onChange={event => setProduct(event.target.value)} rows={5} /></label>
      <label>Implementation / test evidence<textarea value={implementation} onChange={event => setImplementation(event.target.value)} rows={5} /></label>
      <label>UX / accessibility evidence<textarea value={experience} onChange={event => setExperience(event.target.value)} rows={4} /></label>
      <label>Retrieved source evidence<textarea value={evidence} readOnly rows={4} placeholder="Add sources in Hermes' room to include evidence here." /></label>
    </div>
    <button className="primary-button" disabled={!currentUser || evaluation.isPending || !product.trim()} onClick={() => evaluation.mutate({ challenge, product, implementation, experience, evidence }, { onSuccess: () => void history.refetch() })}>
      {evaluation.isPending ? "Judges are reviewing evidence…" : "Run evidence-based evaluation"} <ArrowUpRight size={15} />
    </button>
    {history.data?.length ? <div className="judge-history"><div className="section-kicker">Saved evaluations // latest 10</div><div className="judge-history-list">{history.data.map(run => <div className="judge-history-row" key={run.id}><strong>{run.score}<small>/100</small></strong><span>{String(run.result.summary ?? "Evaluation saved")}</span><time>{new Date(run.createdAt).toLocaleString()}</time></div>)}</div></div> : null}
    {!currentUser && <p className="judge-error">Sign in to run and save evidence-based evaluations.</p>}
    {evaluation.error && <p role="alert" className="judge-error">{evaluation.error.message}</p>}
    {result && <div className="judge-results">
      <div className="judge-score"><span className="mono">WEIGHTED SCORE / 100</span><strong>{result.score}</strong><p>{result.verdict}</p></div>
      <p>{result.summary}</p>
      <div className="judge-criteria">{result.criteria.map(item => <div className="judge-criterion" key={item.key}><div><b>{item.label}</b><span>{item.weight}% weight</span><strong>{item.score.toFixed(1)} / 10</strong></div><p>{item.evidence}</p><small>Improve: {item.improvement}</small></div>)}</div>
      <div className="judge-feedback-grid"><div><b>Strengths</b>{result.strengths.map((item, index) => <p key={index}>{item}</p>)}</div><div><b>Critical gaps</b>{result.criticalGaps.map((item, index) => <p key={index}>{item}</p>)}</div></div>
      <div className="judge-next"><b>Highest-value next actions</b>{result.nextActions.map((item, index) => <p key={index}>{index + 1}. {item}</p>)}</div>
      <small className="mono">RUBRIC {result.rubricVersion} · MODEL {result.provider} · score calculated server-side</small>
    </div>}
  </div>;
}

function AgentRoleChat({ agent, context = [], onHandoff }: { agent: (typeof agents)[number]; context?: Chunk[]; onHandoff?: (id: AgentId) => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "agent"; text: string }>>(() => { try { const saved = JSON.parse(localStorage.getItem(`guidathon-chat-${agent.id}`) || "[]"); return Array.isArray(saved) ? saved.slice(-40) : []; } catch { return []; } });
  const [provider, setProvider] = useState("not called yet");
  const [handoffTo, setHandoffTo] = useState<AgentId | null>(null);
  const { data: currentUser } = trpc.auth.me.useQuery();
  const conversation = trpc.agents.conversation.useQuery({ agent: agent.id }, { enabled: Boolean(currentUser), retry: false });
  const saveConversation = trpc.agents.saveConversation.useMutation();
  const agentChat = trpc.agents.chat.useMutation();

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(`guidathon-chat-${agent.id}`) || "[]"); setMessages(Array.isArray(saved) ? saved.slice(-40) : []); } catch { setMessages([]); }
    setProvider("not called yet");
  }, [agent.id]);
  useEffect(() => {
    try { localStorage.setItem(`guidathon-chat-${agent.id}`, JSON.stringify(messages.slice(-40))); } catch { /* Keep the active chat usable when browser storage is full. */ }
  }, [agent.id, messages]);
  useEffect(() => {
    if (conversation.isSuccess) setMessages(conversation.data.map(message => ({ role: message.role, text: message.text })));
  }, [conversation.isSuccess, conversation.data]);
  const roleIntros: Record<AgentId, string> = {
    hermes: "I am Hermes, the guide and knowledge layer. Ask me about formats, judging, scoping, or what the current sources establish.",
    zeus: "I am Zeus, the orchestrator. I carry the brief between rooms, expose missing context, and make the next handoff explicit.",
    athena: "I am Athena, your lead strategist. I help discover differentiated ideas, identify the real user pain, compare directions, choose a winning MVP, and design the fastest experiment to prove it.",
    hephaestus: "I am Hephaestus, the builder. I turn a selected direction into a practical stack, workflow, and integration boundary.",
    chronos: "I am Chronos, the timekeeper. I turn the build into dated milestones, owners, and a submission sequence.",
  };

  const askRole = async () => {
    const question = input.trim();
    if (!question || agentChat.isPending || saveConversation.isPending) return;
    const pendingTranscript = [...messages, { role: "user" as const, text: question }];
    setMessages(pendingTranscript);
    setInput("");
    if (currentUser) {
      try { await saveConversation.mutateAsync({ agent: agent.id, messages: pendingTranscript }); }
      catch { /* Keep the live chat usable if persistence is temporarily unavailable. */ }
    }
    agentChat.mutate({
      agent: agent.id,
      question,
      provider: agent.id === "hermes" || agent.id === "athena" ? "gemini" : "groq",
      context,
      history: messages.slice(-6).map(message => ({ role: message.role === "agent" ? "assistant" as const : "user" as const, content: message.text })),
    }, {
      onSuccess: result => {
        setProvider(result.provider);
        setHandoffTo(result.handoffTo ?? null);
        const nextTranscript = [...pendingTranscript, { role: "agent" as const, text: result.answer }];
        setMessages(nextTranscript);
        if (currentUser) saveConversation.mutate({ agent: agent.id, messages: nextTranscript });
      },
      onError: () => {
        setProvider("model unavailable");
        const nextTranscript = [...pendingTranscript, { role: "agent" as const, text: "The live model route failed for this request. No AI answer was generated; check the model API key/provider configuration and retry." }];
        setMessages(nextTranscript);
        if (currentUser) saveConversation.mutate({ agent: agent.id, messages: nextTranscript });
      },
    });
  };

  return (
    <div className={`role-chat accent-${agent.accent}`}>
      <div className="role-chat-head"><div><span className="section-kicker">{agent.name}&apos;s role chat</span><span className="role-chat-caption">specialist lens · general questions welcome</span></div><span className="role-chat-provider"><span className="status-dot live" />{provider}</span></div>
      <div className="role-chat-intro"><span className="role-chat-avatar"><img src={agent.art} alt="" /></span><p><b>{agent.name}</b><span>{roleIntros[agent.id]}</span><em>{agent.quote}</em></p></div>
      <div className="role-chat-thread">
        <div className="chat-companion-floating" aria-hidden="true"><img src={agent.art} alt="" /><span>{agent.name}</span></div>
        {!messages.length && !agentChat.isPending && <div className="role-chat-empty"><span>✦</span> Ask anything. {agent.name} can help broadly and brings a specialist perspective when it helps.</div>}
        {messages.slice(-4).map((message, index) => <div className={`role-chat-line ${message.role}`} key={`${message.role}-${index}`}><b>{message.role === "agent" ? agent.name : "you"}</b><span>{message.text}</span></div>)}
        {agentChat.isPending && <div className="role-chat-line agent role-chat-thinking"><b>{agent.name}</b><span>Thinking through the current brief…</span></div>}
      </div>
      {handoffTo && <button className="role-handoff" onClick={() => onHandoff?.(handoffTo)}>Open {agentById(handoffTo).name}&apos;s room <ArrowUpRight size={13} /></button>}
      <div className="role-chat-input"><input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === "Enter" && askRole()} placeholder={`Ask ${agent.name} anything…`} disabled={agentChat.isPending || conversation.isLoading || saveConversation.isPending} /><button onClick={askRole} aria-label={`Ask ${agent.name}`} disabled={agentChat.isPending || conversation.isLoading || saveConversation.isPending}><span>send</span><ArrowUpRight size={14} /></button></div>
    </div>
  );
}
