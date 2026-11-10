import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Circle, FolderGit2, Gauge, Github, Loader2, ShieldCheck, UploadCloud } from "lucide-react";

type Finding = { label: string; detail: string; points: number; ok: boolean; critical?: boolean };
type Audit = { name: string; score: number; verdict: string; findings: Finding[]; summary: string; source: string };

const checks = [
  { key: "readme", label: "Project documentation", detail: "README explains setup, purpose and usage", points: 12 },
  { key: "manifest", label: "Dependency manifest", detail: "Package or dependency manifest is present", points: 12 },
  { key: "lock", label: "Reproducible dependencies", detail: "Lockfile is committed", points: 10 },
  { key: "source", label: "Application source", detail: "Runnable source or entrypoint exists", points: 16 },
  { key: "build", label: "Build / deployment config", detail: "Build script or deployment config exists", points: 16 },
  { key: "tests", label: "Automated tests", detail: "Test files or test script are present", points: 10 },
  { key: "ci", label: "Continuous integration", detail: "CI workflow is configured", points: 8 },
  { key: "env", label: "Environment guidance", detail: "Example environment file or documented variables", points: 8 },
  { key: "license", label: "License", detail: "License file or declared license", points: 4 },
  { key: "security", label: "Secret hygiene", detail: "No obvious committed .env file", points: 4 },
];

function githubRepo(value: string) {
  try {
    const url = new URL(value.trim());
    if (!["github.com", "www.github.com"].includes(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch { return null; }
}

function scoreFiles(names: string[], content = ""): Finding[] {
  const lower = names.map(name => name.toLowerCase());
  const has = (re: RegExp) => lower.some(name => re.test(name));
  const hasManifest = has(/(^|\/)(package\.json|pyproject\.toml|requirements\.txt|cargo\.toml|go\.mod|pom\.xml|build\.gradle|composer\.json)$/);
  const hasSource = has(/(^|\/)(src\/|app\/|pages\/|main\.(ts|tsx|js|jsx|py|go|rs)$|index\.(ts|tsx|js|jsx|html)$)/);
  const hasBuild = has(/(^|\/)(vercel\.json|netlify\.toml|dockerfile|vite\.config\.[^/]+|next\.config\.[^/]+|webpack\.config\.[^/]+|\.github\/workflows\/[^/]+|render\.yaml)$/) || /"build"\s*:\s*"/s.test(content);
  const hasTests = has(/(^|\/)(__tests__\/|tests?\/|[^/]+\.(test|spec)\.)/) || /"test"\s*:\s*"/.test(content);
  const hasCI = has(/(^|\/)\.github\/workflows\//);
  const hasEnv = has(/(^|\/)(\.env\.example|\.env\.sample|\.env\.template)$/) || /environment variables|\.env\.example/i.test(content);
  const hasReadme = has(/(^|\/)readme(\.md|\.txt)?$/);
  const hasLock = has(/(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|poetry\.lock|uv\.lock|cargo\.lock|pipfile\.lock)$/);
  const hasLicense = has(/(^|\/)license(\.md|\.txt)?$/) || /"license"\s*:/.test(content);
  const hasEnvLeak = has(/(^|\/)\.env$/) || /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content);
  const flags = [hasReadme,hasManifest,hasLock,hasSource,hasBuild,hasTests,hasCI,hasEnv,hasLicense,!hasEnvLeak];
  return checks.map((item, i) => ({ label:item.label, detail:item.detail, points:item.points, ok:flags[i], critical:i===1||i===3||i===4 }));
}

async function auditGithub(value: string): Promise<Audit> {
  const repo = githubRepo(value);
  if (!repo) throw new Error("Enter a public GitHub repository URL, such as https://github.com/owner/repo.");
  const headers = { Accept: "application/vnd.github+json" };
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`, { headers, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(response.status === 404 ? "Repository not found or private. Public repositories are supported without a token." : `GitHub returned HTTP ${response.status}. Try again or upload project files.`);
  const meta = await response.json();
  const branch = meta.default_branch || "main";
  const treeResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`, { headers, signal: AbortSignal.timeout(15000) });
  if (!treeResponse.ok) throw new Error("Could not inspect the repository file tree. Check GitHub API access or upload files instead.");
  const tree = await treeResponse.json();
  const names: string[] = (tree.tree || []).filter((item: any) => item.type === "blob").map((item: any) => item.path);
  let readme = "";
  let manifest = "";
  const readmePath = names.find(name => /^readme(\\.md|\\.txt)?$/i.test(name.split("/").pop() || ""));
  const manifestPath = names.find(name => /^(package\\.json|pyproject\\.toml|requirements\\.txt|cargo\\.toml|go\\.mod)$/i.test(name.split("/").pop() || ""));
  const fetchText = async (path: string | undefined, limit: number) => {
    if (!path) return "";
    const raw = await fetch(`https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${branch}/${path.split("/").map(encodeURIComponent).join("/")}`, { signal: AbortSignal.timeout(8000) });
    return raw.ok ? (await raw.text()).slice(0, limit) : "";
  };
  [readme, manifest] = await Promise.all([fetchText(readmePath, 12000), fetchText(manifestPath, 12000)]);
  const findings = scoreFiles(names, readme + manifest + JSON.stringify({ license: meta.license?.spdx_id }));
  const score = Math.round(findings.reduce((sum, item) => sum + (item.ok ? item.points : 0), 0));
  const criticalMissing = findings.filter(item => item.critical && !item.ok);
  const deployable = criticalMissing.length === 0;
  return { name: meta.full_name || value, score, verdict: deployable ? "Potentially deployable" : "Not deployment-ready", findings, source: `GitHub public API · default branch: ${branch}`, summary: `${names.length} tracked files inspected. ${tree.truncated ? "GitHub truncated the file tree, so this score is partial. " : ""}${deployable ? "Core source, manifest and build/deploy signals are present." : "Critical deployment signals are missing: " + criticalMissing.map(item => item.label).join(", ") + "."} A static repository scan cannot prove that a build or deployment will succeed.` };
}

async function auditUploads(files: File[]): Promise<Audit> {
  const names = files.map(file => file.webkitRelativePath || file.name);
  const readable = files.filter(file => file.size <= 300_000 && /\.(md|txt|json|ya?ml|toml|js|jsx|ts|tsx|py|html)$/i.test(file.name)).slice(0, 18);
  const content = (await Promise.all(readable.map(file => file.text().catch(() => "")))).join("\n").slice(0, 60000);
  const findings = scoreFiles(names, content);
  const score = Math.round(findings.reduce((sum, item) => sum + (item.ok ? item.points : 0), 0));
  const criticalMissing = findings.filter(item => item.critical && !item.ok);
  return { name: `${files.length} uploaded file(s)`, score, verdict: criticalMissing.length ? "Not deployment-ready" : "Potentially deployable", findings, source: "Local file inspection · no files uploaded to a server", summary: `${files.length} files inspected. ${criticalMissing.length ? "Missing critical signals: " + criticalMissing.map(item => item.label).join(", ") + "." : "Core source and build signals are present."} This is a static checklist, not an executed build.` };
}

export default function ProjectReadinessAuditor() {
  const [repoUrl, setRepoUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scoreColor = audit && audit.score >= 80 ? "good" : audit && audit.score >= 55 ? "mid" : "low";
  const run = async () => {
    setLoading(true); setError(""); setAudit(null);
    try {
      const result = repoUrl.trim() ? await auditGithub(repoUrl) : files.length ? await auditUploads(files) : null;
      if (!result) throw new Error("Paste a GitHub repository URL or choose project files first.");
      setAudit(result);
    } catch (err) { setError(err instanceof Error ? err.message : "The project could not be inspected."); }
    finally { setLoading(false); }
  };
  return <section className="readiness-auditor">
    <div className="readiness-heading"><div className="readiness-mark"><Gauge size={19}/></div><div><span className="readiness-eyebrow">ZEUS · PROJECT INTELLIGENCE</span><h3>Project readiness audit</h3><p>Inspect a repository or local files before you attempt deployment.</p></div><span className="readiness-live"><i/> STATIC SCAN</span></div>
    <div className="readiness-inputs">
      <label className="readiness-url"><span>GitHub repository URL</span><div><Github size={16}/><input value={repoUrl} onChange={event=>setRepoUrl(event.target.value)} placeholder="https://github.com/owner/repository" onKeyDown={event=>{if(event.key==="Enter") void run();}}/></div></label>
      <div className="readiness-or">OR</div>
      <label className="readiness-upload"><UploadCloud size={18}/><span><b>{files.length ? `${files.length} files selected` : "Choose project files"}</b><small>Multi-select source, config, README and test files</small></span><input type="file" multiple onChange={event=>setFiles(Array.from(event.target.files||[]))}/></label>
      <button className="readiness-run" onClick={()=>void run()} disabled={loading}>{loading?<Loader2 className="spin" size={16}/>:<Activity size={16}/>} {loading?"Inspecting…":"Run readiness audit"}</button>
    </div>
    {error && <div className="readiness-error"><AlertTriangle size={15}/>{error}</div>}
    {audit && <div className="readiness-results">
      <div className="readiness-score-wrap"><div className={`readiness-score ${scoreColor}`}><strong>{audit.score}%</strong><span>readiness</span></div><div className="readiness-verdict"><span className={`verdict-pill ${scoreColor}`}>{audit.verdict}</span><b>{audit.name}</b><p>{audit.summary}</p><small>{audit.source}</small></div></div>
      <div className="readiness-checks">{audit.findings.map(item=><div key={item.label} className={`readiness-check ${item.ok?"pass":"miss"}`}>{item.ok?<CheckCircle2 size={16}/>:item.critical?<AlertTriangle size={16}/>:<Circle size={16}/>}<span><b>{item.label}</b><small>{item.detail}</small></span><em>{item.ok?"+":""}{item.ok?item.points:0}/{item.points}</em></div>)}</div>
      <div className="readiness-foot"><ShieldCheck size={15}/><span>Verdict is evidence-based, not a deployment guarantee. Build, secrets, runtime and hosting configuration still need live verification.</span></div>
    </div>}
    {!audit && <div className="readiness-hint"><FolderGit2 size={15}/> Zeus checks documentation, source, dependencies, build configuration, tests, CI, environment guidance and secret hygiene.</div>}
  </section>;
}
