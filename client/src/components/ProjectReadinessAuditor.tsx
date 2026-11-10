import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Circle, FolderGit2, Gauge, Github, Loader2, ShieldCheck, UploadCloud } from "lucide-react";

type Finding = { label: string; detail: string; points: number; ok: boolean; critical?: boolean };
type RuntimeStatus = { reachable: boolean; openrouterConfigured: boolean; databaseConfigured: boolean; authenticationConfigured: boolean };
type Audit = { name: string; score: number; verdict: string; findings: Finding[]; summary: string; source: string; runtime: RuntimeStatus | null };

const checks = [
  { key: "readme", label: "Project documentation", detail: "README explains setup, purpose and usage", points: 10 },
  { key: "manifest", label: "Dependency manifest", detail: "Package or dependency manifest is present", points: 12 },
  { key: "lock", label: "Reproducible dependencies", detail: "Lockfile is committed", points: 8 },
  { key: "source", label: "Application source", detail: "Runnable source or entrypoint exists", points: 15 },
  { key: "build", label: "Build / deployment config", detail: "Build command or deployment configuration is present", points: 15 },
  { key: "tests", label: "Automated tests", detail: "Test files or a test script are present", points: 10 },
  { key: "ci", label: "Continuous integration", detail: "A CI workflow is configured", points: 5 },
  { key: "ciRun", label: "Latest CI verification", detail: "Latest public GitHub Actions run completed successfully", points: 15 },
  { key: "env", label: "Environment guidance", detail: "Example environment file or documented variables", points: 5 },
  { key: "license", label: "License", detail: "License file or declared license", points: 3 },
  { key: "security", label: "Secret hygiene", detail: "No obvious committed .env file or private key", points: 2 },
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

async function inspectRuntime(): Promise<RuntimeStatus | null> {
  try {
    const response = await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { reachable: false, openrouterConfigured: false, databaseConfigured: false, authenticationConfigured: false };
    const data = await response.json();
    const capabilities = data?.capabilities || {};
    return {
      reachable: data?.status === "ok",
      openrouterConfigured: Boolean(capabilities.openrouterConfigured),
      databaseConfigured: Boolean(capabilities.persistentDatabaseConfigured),
      authenticationConfigured: Boolean(capabilities.authenticationConfigured),
    };
  } catch {
    return null;
  }
}

function scoreFiles(names: string[], content = "", ciSuccessful = false, ciRunDetail = "CI execution cannot be verified from uploaded files."): Finding[] {
  const lower = names.map(name => name.toLowerCase());
  const has = (re: RegExp) => lower.some(name => re.test(name));
  const hasManifest = has(/(^|\/)(package\.json|pyproject\.toml|requirements\.txt|cargo\.toml|go\.mod|pom\.xml|build\.gradle|composer\.json)$/);
  const hasSource = has(/(^|\/)(src\/|app\/|pages\/|main\.(ts|tsx|js|jsx|py|go|rs)$|index\.(ts|tsx|js|jsx|html)$)/);
  const hasBuild = has(/(^|\/)(vercel\.json|netlify\.toml|dockerfile|vite\.config\.[^/]+|next\.config\.[^/]+|webpack\.config\.[^/]+|render\.yaml)$/) || /"build"\s*:\s*"/s.test(content);
  const hasTests = has(/(^|\/)(__tests__\/|tests?\/|[^/]+\.(test|spec)\.)/) || /"test"\s*:\s*"/.test(content);
  const hasCI = has(/(^|\/)\.github\/workflows\//);
  const hasEnv = has(/(^|\/)(\.env\.example|\.env\.sample|\.env\.template)$/) || /environment variables|\.env\.example/i.test(content);
  const hasReadme = has(/(^|\/)readme(\.md|\.txt)?$/);
  const hasLock = has(/(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|poetry\.lock|uv\.lock|cargo\.lock|pipfile\.lock)$/);
  const hasLicense = has(/(^|\/)license(\.md|\.txt)?$/) || /"license"\s*:/.test(content);
  const hasEnvLeak = has(/(^|\/)\.env$/) || /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content);
  const flags = [hasReadme, hasManifest, hasLock, hasSource, hasBuild, hasTests, hasCI, ciSuccessful, hasEnv, hasLicense, !hasEnvLeak];
  return checks.map((item, index) => ({
    label: item.label,
    detail: item.key === "ciRun" ? ciRunDetail : item.detail,
    points: item.points,
    ok: flags[index],
    critical: ["manifest", "source", "build", "ciRun"].includes(item.key),
  }));
}

async function auditGithub(value: string, branchOverride: string): Promise<Audit> {
  const repo = githubRepo(value);
  if (!repo) throw new Error("Enter a public GitHub repository URL, such as https://github.com/owner/repo.");
  const headers = { Accept: "application/vnd.github+json" };
  const base = `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
  const response = await fetch(base, { headers, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(response.status === 404 ? "Repository not found or private. Public repositories are supported without a token." : `GitHub returned HTTP ${response.status}. Try again or upload project files.`);
  const meta = await response.json();
  const branch = branchOverride.trim() || meta.default_branch || "main";
  const treeResponse = await fetch(`${base}/git/trees/${encodeURIComponent(branch)}?recursive=1`, { headers, signal: AbortSignal.timeout(15000) });
  if (!treeResponse.ok) throw new Error("Could not inspect the repository file tree. Check GitHub API access or upload project files instead.");
  const tree = await treeResponse.json();
  const names: string[] = (tree.tree || []).filter((item: any) => item.type === "blob").map((item: any) => item.path);
  const readmePath = names.find(name => /^readme(\.md|\.txt)?$/i.test(name.split("/").pop() || ""));
  const manifestPath = names.find(name => /^(package\.json|pyproject\.toml|requirements\.txt|cargo\.toml|go\.mod)$/i.test(name.split("/").pop() || ""));
  const fetchText = async (path: string | undefined, limit: number) => {
    if (!path) return "";
    const raw = await fetch(`https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${branch}/${path.split("/").map(encodeURIComponent).join("/")}`, { signal: AbortSignal.timeout(8000) });
    return raw.ok ? (await raw.text()).slice(0, limit) : "";
  };
  const [readme, manifest, workflowResponse] = await Promise.all([
    fetchText(readmePath, 12000),
    fetchText(manifestPath, 12000),
    fetch(`${base}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=5`, { headers, signal: AbortSignal.timeout(12000) }).catch(() => null),
  ]);
  let ciSuccessful = false;
  let ciRunDetail = "No public workflow run found for this branch.";
  if (workflowResponse?.ok) {
    const workflowData = await workflowResponse.json().catch(() => ({}));
    const latest = workflowData.workflow_runs?.[0];
    if (latest) {
      ciSuccessful = latest.status === "completed" && latest.conclusion === "success";
      ciRunDetail = `${latest.name || "Workflow"} · ${latest.status || "unknown"} / ${latest.conclusion || "pending"}`;
    }
  } else if (workflowResponse) {
    ciRunDetail = `GitHub Actions status unavailable (HTTP ${workflowResponse.status}).`;
  }
  const findings = scoreFiles(names, readme + manifest + JSON.stringify({ license: meta.license?.spdx_id }), ciSuccessful, ciRunDetail);
  const score = Math.round(findings.reduce((sum, item) => sum + (item.ok ? item.points : 0), 0));
  const criticalMissing = findings.filter(item => item.critical && !item.ok);
  const latestCi = ciRunDetail;
  const runtime = await inspectRuntime();
  return {
    name: meta.full_name || value,
    runtime,
    score,
    verdict: criticalMissing.length ? "Release blockers found" : "Repository signals present · runtime unverified",
    findings,
    source: `GitHub public API · branch: ${branch} · latest CI: ${latestCi}`,
    summary: `${names.length} tracked files inspected. ${tree.truncated ? "GitHub truncated the file tree, so this score is partial. " : ""}${criticalMissing.length ? "Critical evidence is missing: " + criticalMissing.map(item => item.label).join(", ") + ". " : "Core repository evidence is present. "}A green workflow is a CI signal only: this browser audit does not execute a fresh build or verify the live Vercel runtime.`,
  };
}

async function auditUploads(files: File[]): Promise<Audit> {
  const names = files.map(file => file.webkitRelativePath || file.name);
  const readable = files.filter(file => file.size <= 300_000 && /\.(md|txt|json|ya?ml|toml|js|jsx|ts|tsx|py|html)$/i.test(file.name)).slice(0, 18);
  const content = (await Promise.all(readable.map(file => file.text().catch(() => "")))).join("\n").slice(0, 60000);
  const findings = scoreFiles(names, content, false, "Not verifiable from local file selection; upload or link a repository with CI history.");
  const score = Math.round(findings.reduce((sum, item) => sum + (item.ok ? item.points : 0), 0));
  const criticalMissing = findings.filter(item => item.critical && !item.ok);
  const runtime = await inspectRuntime();
  return {
    name: `${files.length} uploaded file(s)`,
    runtime,
    score,
    verdict: criticalMissing.length ? "Evidence incomplete" : "Static file signals present · runtime unverified",
    findings,
    source: "Local file inspection · no files uploaded to a server",
    summary: `${files.length} files inspected. ${criticalMissing.length ? "Critical evidence is missing: " + criticalMissing.map(item => item.label).join(", ") + ". " : "Core file signals are present. "}No build, test suite, deployment or runtime was executed by this local scan.`,
  };
}

export default function ProjectReadinessAuditor() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scoreColor = audit && audit.score >= 80 ? "good" : audit && audit.score >= 55 ? "mid" : "low";
  const run = async () => {
    setLoading(true); setError(""); setAudit(null);
    try {
      const result = repoUrl.trim() ? await auditGithub(repoUrl, branchInput) : files.length ? await auditUploads(files) : null;
      if (!result) throw new Error("Paste a GitHub repository URL or choose project files first.");
      setAudit(result);
    } catch (err) { setError(err instanceof Error ? err.message : "The project could not be inspected."); }
    finally { setLoading(false); }
  };
  return <section className="readiness-auditor">
    <div className="readiness-heading"><div className="readiness-mark"><Gauge size={19}/></div><img className="readiness-agent-chibi" src="/agents/zeus.svg" alt="Zeus chibi release guardian" loading="lazy"/><div><span className="readiness-eyebrow">ZEUS · PROJECT INTELLIGENCE</span><h3>Project readiness audit</h3><p>Inspect repository evidence and the latest public CI result. Runtime verification is separate.</p></div><span className="readiness-live"><i/> REPO + CI</span></div>
    <div className="readiness-inputs">
      <label className="readiness-url"><span>GitHub repository URL</span><div><Github size={16}/><input value={repoUrl} onChange={event=>setRepoUrl(event.target.value)} placeholder="https://github.com/owner/repository" onKeyDown={event=>{if(event.key==="Enter") void run();}}/></div></label>
      <label className="readiness-branch"><span>Branch (optional)</span><input value={branchInput} onChange={event=>setBranchInput(event.target.value)} placeholder="Default branch" onKeyDown={event=>{if(event.key==="Enter") void run();}}/></label>
      <div className="readiness-or">OR</div>
      <label className="readiness-upload"><UploadCloud size={18}/><span><b>{files.length ? `${files.length} files selected` : "Choose project files"}</b><small>Multi-select source, config, README and test files</small></span><input type="file" multiple onChange={event=>setFiles(Array.from(event.target.files||[]))}/></label>
      <button className="readiness-run" onClick={()=>void run()} disabled={loading}>{loading?<Loader2 className="spin" size={16}/>:<Activity size={16}/>} {loading?"Inspecting…":"Run readiness audit"}</button>
    </div>
    {error && <div className="readiness-error"><AlertTriangle size={15}/>{error}</div>}
    {audit && <div className="readiness-results">
      <div className="readiness-score-wrap"><div className={`readiness-score ${scoreColor}`}><strong>{audit.score}%</strong><span>evidence</span></div><div className="readiness-verdict"><span className={`verdict-pill ${scoreColor}`}>{audit.verdict}</span><b>{audit.name}</b><p>{audit.summary}</p><small>{audit.source}</small></div></div>
      <div className={`readiness-runtime ${audit.runtime?.reachable ? "pass" : "miss"}`}><span><b>GUIDATHON live API</b><small>{audit.runtime === null ? "Runtime could not be reached from this page." : audit.runtime.reachable ? "API endpoint responded successfully." : "API endpoint did not respond successfully."}</small></span><span><b>OpenRouter credential</b><small>{audit.runtime === null ? "Unknown · API health unavailable" : audit.runtime.openrouterConfigured ? "Configured · presence only; key validity not tested" : "Not detected in the current deployment"}</small></span><span><b>Persistence</b><small>{audit.runtime === null ? "Unknown" : audit.runtime.databaseConfigured ? "Database configured" : "Database not configured"}</small></span></div>
      <div className="readiness-checks">{audit.findings.map(item=><div key={item.label} className={`readiness-check ${item.ok?"pass":"miss"}`}>{item.ok?<CheckCircle2 size={16}/>:item.critical?<AlertTriangle size={16}/>:<Circle size={16}/>}<span><b>{item.label}</b><small>{item.detail}</small></span><em>{item.ok?"+":""}{item.ok?item.points:0}/{item.points}</em></div>)}</div>
      <div className="readiness-foot"><ShieldCheck size={15}/><span>Evidence score only. Static repository metadata and latest public CI status do not prove that a fresh build or live deployment works. Verify the Vercel deployment and runtime separately.</span></div>
    </div>}
    {!audit && <div className="readiness-hint"><FolderGit2 size={15}/> Zeus checks documentation, source, dependencies, build configuration, tests, CI configuration, latest workflow result, environment guidance and secret hygiene.</div>}
  </section>;
}
